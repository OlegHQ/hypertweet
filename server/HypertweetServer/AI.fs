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
        let rec loop =
            function
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
            .Replace("’", "'")
            .Replace("“", "\"")
            .Replace("”", "\"")
            .Replace("…", "...")
            .Replace(
                """, "\"")
            .Replace(""",
                "\""
            )
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
                completion
                |> Result.map (fun x -> if postProcessReply then applyPostProcess x else x)

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

            return
                { EventId = evt.Id.ToString()
                  Reply = completion }
        }

module Chat =
    let buildSystemPrompt = Prompts.ChatPrompt.make

module Handlers =
    type ReplyRequest = { ToneId: string; Page: Page }

    [<CLIMutable>]
    type ChatMessageReq = { Role: string; Content: string }

    [<CLIMutable>]
    type ChatRequest =
        { Messages: ChatMessageReq list
          PageContext: Page }

    let private validateChat (req: ChatRequest) =
        if req.Messages |> List.isEmpty then
            Error(ValidationError("messages", "cannot be empty"))
        else
            Ok req

    let chat db llmApiKey next ctx =
        taskResult {
            let! apiKey = llmApiKey |> Result.requireSome (InternalError "LLM API KEY not configured")
            let userId = HttpCtx.getUserId ctx
            let! req = HttpCtx.bindJson<ChatRequest> ctx |> Task.map validateChat

            let! profile = DataAccess.profile db userId

            let! user =
                DataAccess.user db userId
                |> Async.map (Result.bind (Result.requireSome (NotFound "User")))

            let persona = profile |> Option.bind (fun p -> p.ChatBotPersona)
            let userBio = profile |> Option.bind (fun p -> p.UserBio)

            let replyPromptOptions =
                profile |> Option.map ReplyPromptOption.fromProfile |> Option.defaultValue []

            let model =
                profile
                |> Option.map (fun p -> p.ModelName)
                |> Option.defaultValue ModelConfig.defaultModel

            let systemPrompt =
                Chat.buildSystemPrompt persona req.PageContext userBio replyPromptOptions

            let messages =
                [| yield ChatMessage.CreateSystemMessage systemPrompt :> ChatMessage
                   for msg in req.Messages do
                       match msg.Role with
                       | "user" -> yield ChatMessage.CreateUserMessage msg.Content :> ChatMessage
                       | "assistant" -> yield ChatMessage.CreateAssistantMessage msg.Content :> ChatMessage
                       | _ -> () |]

            let chatId = newId ()
            SSE.setHeaders ctx
            ctx.Response.StatusCode <- 200
            do! SSE.writeJson ctx "chatId" chatId

            let responseBuilder = System.Text.StringBuilder()
            let startTime = DateTime.UtcNow

            let! _ =
                AIClient.stream apiKey model messages (fun token ->
                    let processed = Service.applyPostProcess token
                    responseBuilder.Append processed |> ignore
                    SSE.writeJson ctx "token" processed)

            let elapsed = (DateTime.UtcNow - startTime).TotalMilliseconds |> int

            let chatMessages =
                req.Messages
                |> List.map (fun m ->
                    { Tracing.TracingEvents.ChatEvent.Role = m.Role
                      Tracing.TracingEvents.ChatEvent.Content = m.Content })

            let traceResult: Tracing.TracingEvents.ChatEvent.Result =
                { Response = responseBuilder.ToString()
                  TimeTookMs = elapsed }

            let! _ = Tracing.saveChatEvent db systemPrompt chatMessages model req.PageContext user traceResult

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

