module HypertweetServer.AI

open System
open System.ClientModel
open OpenAI.Chat
open FsToolkit.ErrorHandling
open Giraffe
open Microsoft.AspNetCore.Http
open Base
open Base.Common
open Base.PromptDsl
open Base.PromptDsl.Dsl
open Base.PromptDsl.Domain
open HypertweetServer.Models

module ModelConfig = HypertweetServer.Profiles.ModelConfig

module AIClient =
    let private endpoint = Uri "https://openrouter.ai/api/v1"

    let private makeClient apiKey modelId =
        let cred = ApiKeyCredential apiKey
        let opts = OpenAI.OpenAIClientOptions(Endpoint = endpoint)
        ChatClient(modelId, cred, opts)

    let complete apiKey modelId (messages: ChatMessage array) =
        task {
            try
                let client = makeClient apiKey modelId
                let! response = client.CompleteChatAsync messages
                return
                    response.Value.Content
                    |> Seq.tryHead
                    |> Option.map (fun c -> c.Text)
                    |> Option.defaultValue ""
                    |> Ok
            with
            | :? ClientResultException as ex when ex.Status = 429 ->
                return Error(RateLimited $"Rate limited on {modelId}")
            | ex -> return Error(InternalError $"AI completion failed: {ex.Message}")
        }

    let completeWithFallbacks apiKey models messages =
        let rec loop = function
            | [] -> task { return Error(InternalError "exhausted all fallbacks") }
            | model :: rest ->
                task {
                    let! result = complete apiKey model messages
                    match result with
                    | Error(RateLimited _) -> return! loop rest
                    | other -> return other
                }
        loop models

    let stream apiKey modelId (messages: ChatMessage array) onToken =
        task {
            try
                let client = makeClient apiKey modelId
                let updates = client.CompleteChatStreamingAsync messages
                let enum = updates.GetAsyncEnumerator()
                let mutable hasMore = true
                while hasMore do
                    let! next = enum.MoveNextAsync()
                    hasMore <- next
                    if hasMore then
                        for content in enum.Current.ContentUpdate do
                            if not (String.IsNullOrEmpty content.Text) then
                                do! onToken content.Text
                return Ok()
            with
            | :? ClientResultException as ex when ex.Status = 429 ->
                return Error(RateLimited $"Rate limited on {modelId}")
            | ex -> return Error(InternalError $"Stream failed: {ex.Message}")
        }

module Service =
    open HypertweetServer.Tones

    let private resolveModelInputs logger db toneId userId =
        taskResult {
            let! user = DataAccess.user db userId
            let! profile = DataAccess.profile db userId
            logger |> Log.info "loading tones..."
            let! userTones = DataAccess.userTones db userId
            logger |> Log.info "tones are loaded"
            let! user = user |> Result.requireSome (NotFound "User")

            let model =
                match profile with
                | Some profile -> profile.ModelName
                | _ -> ModelConfig.defaultModel

            let dps = Handlers.makeResolvedTones user userTones

            let! tone =
                dps
                |> List.tryFind (fun x -> x.Id = toneId)
                |> Result.requireSome (NotFound "Tone")

            return tone, model, user, profile
        }

    type ReplyEvent = { EventId: string; Reply: string }

    let applyPostProcess (reply: string) =
        reply
            .Replace("—", ", ")
            .Replace(""", "\"")
            .Replace(""", "\"")
            .Replace("'", "'")
            .Replace("'", "'")

    let generateReply logger db llmApiKey (page: Page) toneId userId =
        taskResult {
            let! tone, model, user, profile = resolveModelInputs logger db toneId userId
            let userBio = profile |> Option.bind (fun x -> x.UserBio)
            let customReplyGuidance = profile |> Option.bind (fun x -> x.CustomReplyGuidance)

            let replyPromptOptions =
                profile |> Option.map ReplyPromptOption.fromProfile |> Option.defaultValue []

            let postProcessReply =
                profile |> Option.bind (fun x -> x.PostProcessReply) |> Option.defaultValue true

            let promptText =
                Prompts.ReplyPrompt.make tone page userBio customReplyGuidance replyPromptOptions

            let messages = [| ChatMessage.CreateUserMessage promptText :> ChatMessage |]
            let models = [ model ] @ ModelConfig.fallbackModels |> List.distinct

            let! completion, timeSpent =
                TracingUtils.measureTask (fun () -> AIClient.completeWithFallbacks llmApiKey models messages)

            let! completion =
                completion |> Result.map (fun x -> if postProcessReply then applyPostProcess x else x)

            logger |> Log.info "Completion generated"

            let! evt =
                Tracing.saveLLMReplyEvent
                    db
                    promptText
                    tone
                    model
                    page
                    user
                    { TimeTookMs = int timeSpent.TotalMilliseconds
                      Reply = completion }

            return { EventId = evt.Id.ToString(); Reply = completion }
        }

module Chat =
    let private defaultPersona =
        "You are an AI assistant helping users craft social media replies. " +
        "Help critique and improve draft replies. Be concise and actionable. " +
        "Consider platform norms and character limits."

    let buildSystemPrompt (persona: string option) (page: Page) =
        let postText = page.ActivePost |> Option.map (fun p -> p.Text) |> Option.defaultValue ""
        prompt {
            Item.text (persona |> Option.defaultValue defaultPersona) |> nl
            Item.rich (
                TextContent.Concat [
                    TextContent.LabeledText("Platform", page.Site)
                    TextContent.NewLine
                    TextContent.LabeledText("URL", page.Url)
                ]
            ) |> xml "context" |> nl
            Item.text postText |> xml "post"
        }

module Handlers =
    type ReplyRequest = { ToneId: string; Page: Page }

    [<CLIMutable>]
    type ChatRequest = { Message: string; PageContext: Page }

    let private validateChat (req: ChatRequest) =
        req.Message
        |> Validate.notEmpty "message"
        |> Result.map (fun m -> { req with Message = m })

    let chat db llmApiKey next ctx =
        taskResult {
            let! apiKey = llmApiKey |> Result.requireSome (InternalError "LLM API KEY not configured")
            let userId = HttpCtx.getUserId ctx
            let! req = HttpCtx.bindJson<ChatRequest> ctx |> Task.map validateChat

            let! profile = DataAccess.profile db userId
            let persona = profile |> Option.bind (fun p -> p.ChatBotPersona)
            let model = profile |> Option.map (fun p -> p.ModelName) |> Option.defaultValue ModelConfig.defaultModel

            let systemPrompt = Chat.buildSystemPrompt persona req.PageContext
            let messages = [|
                ChatMessage.CreateSystemMessage systemPrompt :> ChatMessage
                ChatMessage.CreateUserMessage req.Message :> ChatMessage
            |]

            let chatId = newId ()
            SSE.setHeaders ctx
            ctx.Response.StatusCode <- 200
            do! SSE.writeJson ctx "chatId" chatId

            let! _ = AIClient.stream apiKey model messages (fun token -> SSE.writeJson ctx "token" token)
            do! SSE.writeDone ctx

            return Some ctx
        }
        |> HttpCtx.errHandle next ctx

    let reply db llmApiKey next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx
            let! req = HttpCtx.bindJson<ReplyRequest> ctx
            let! llmApiKey = llmApiKey |> Result.requireSome (InternalError "LLM API KEY not configured")
            let logger = Log.http ctx
            logger |> Log.info "Generating reply"
            let! reply = Service.generateReply logger db llmApiKey req.Page req.ToneId userId
            return! json reply next ctx
        }
        |> HttpCtx.errHandle next ctx
