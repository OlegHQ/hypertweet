namespace HypertweetServer.AI

open FsToolkit.ErrorHandling
open Base
open Base.Common
open HypertweetServer.Models

module ModelConfig = HypertweetServer.Profiles.ModelConfig


module AI =
    open System
    open System.ClientModel
    open OpenAI.Chat

    let private openRouterEndpoint = Uri "https://openrouter.ai/api/v1"

    let getCompletion (apiKey: string) (modelId: string) (prompt: string) =
        task {
            try
                let credential = ApiKeyCredential apiKey
                let options = OpenAI.OpenAIClientOptions(Endpoint = openRouterEndpoint)
                let client = ChatClient(modelId, credential, options)

                let messages = [| ChatMessage.CreateUserMessage prompt :> ChatMessage |]
                let! response = client.CompleteChatAsync messages

                return
                    response.Value.Content
                    |> Seq.tryHead
                    |> Option.map (fun c -> c.Text)
                    |> Option.defaultValue ""
                    |> Ok
            with ex ->
                return Error(InternalError $"AI completion failed: {ex.Message}")
        }

module Service =
    open HypertweetServer
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
            .Replace(
                """, "\"")
            .Replace(""",
                "\""
            )
            .Replace("'", "'")
            .Replace("’", "'")
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

            let prompt =
                Prompts.ReplyPrompt.make tone page userBio customReplyGuidance replyPromptOptions

            let! completion, timeSpent = TracingUtils.measureTask (fun () -> AI.getCompletion llmApiKey model prompt)

            let! completion =
                completion
                |> Result.map (fun x -> if postProcessReply then applyPostProcess x else x)

            logger |> Log.info "Completion generated"

            let! evt =
                Tracing.saveLLMReplyEvent
                    db
                    prompt
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

module Handlers =
    open Giraffe

    type ReplyRequest = { ToneId: string; Page: Page }
    type ReplyResult = { Reply: string }

    let reply db llmApiKey next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx
            let! req = HttpCtx.bindJson<ReplyRequest> ctx

            let! llmApiKey = llmApiKey |> Result.requireSome (InternalError "LLM API KEY not configured")
            let page = req.Page
            let toneId = req.ToneId
            let logger = Log.http ctx
            logger |> Log.info "Generating reply"
            let! reply = Service.generateReply logger db llmApiKey page toneId userId

            return! json reply next ctx
        }
        |> HttpCtx.errHandle next ctx

