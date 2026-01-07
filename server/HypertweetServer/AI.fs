module HypertweetServer.AI

open System
open System.ClientModel
open OpenAI.Chat
open Google.GenAI
open Google.GenAI.Types
open FsToolkit.ErrorHandling
open Giraffe
open Base
open Base.Common
open HypertweetServer.Models
open ClaudeAgentSdk

module ModelConfig = Profiles.ModelConfig


type ProviderKey =
    | Groq of string
    | OpenRouter of string
    | GoogleKey of string
    | ClaudeKey

module OpenAIClient =
    let private makeClient apiKey modelId =
        let key, endpoint =
            match apiKey with
            | Groq value -> value, "https://api.groq.com/openai/v1"
            | OpenRouter value -> value, "https://openrouter.ai/api/v1"
            | _ -> "", ""

        let cred = ApiKeyCredential key
        let opts = OpenAI.OpenAIClientOptions(Endpoint = Uri endpoint)
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

module GoogleAIClient =
    let private makeClient apiKey = new Client(apiKey = apiKey)

    let private convertRole (msg: ChatMessage) =
        match msg with
        | :? SystemChatMessage -> "user"
        | :? UserChatMessage -> "user"
        | :? AssistantChatMessage -> "model"
        | _ -> "user"

    let private getMessageText (msg: ChatMessage) =
        msg.Content
        |> Seq.tryHead
        |> Option.map (fun p -> p.Text)
        |> Option.defaultValue ""

    let private toGoogleContents (messages: ChatMessage array) =
        messages
        |> Array.map (fun msg ->
            let part = Part(Text = getMessageText msg)
            Content(Role = convertRole msg, Parts = ResizeArray [ part ]))
        |> Array.toList
        |> ResizeArray

    let private extractText (response: GenerateContentResponse) =
        response.Candidates
        |> Option.ofObj
        |> Option.bind (fun candidates -> candidates |> Seq.tryHead)
        |> Option.bind (fun candidate -> candidate.Content |> Option.ofObj)
        |> Option.bind (fun content -> content.Parts |> Option.ofObj)
        |> Option.bind (fun parts -> parts |> Seq.tryHead)
        |> Option.bind (fun part -> part.Text |> Option.ofObj)
        |> Option.defaultValue ""

    let complete apiKey modelId (messages: ChatMessage array) =
        task {
            try
                let client = makeClient apiKey
                let contents = toGoogleContents messages
                let! response = client.Models.GenerateContentAsync(modelId, contents, null)
                let text = extractText response
                return Ok text
            with
            | ex when ex.Message.Contains "429" -> return Error(RateLimited $"Rate limited on {modelId}")
            | ex -> return Error(InternalError $"AI completion failed: {ex.Message}")
        }

    let stream apiKey modelId (messages: ChatMessage array) onToken =
        task {
            try
                let client = makeClient apiKey
                let contents = toGoogleContents messages
                let responses = client.Models.GenerateContentStreamAsync(modelId, contents, null)

                let enumerator = responses.GetAsyncEnumerator()
                let mutable hasMore = true

                while hasMore do
                    let! next = enumerator.MoveNextAsync()
                    hasMore <- next

                    if hasMore then
                        let text = extractText enumerator.Current

                        if not (String.IsNullOrEmpty text) then
                            do! onToken text

                return Ok()
            with
            | ex when ex.Message.Contains "429" -> return Error(RateLimited $"Rate limited on {modelId}")
            | ex -> return Error(InternalError $"Stream failed: {ex.Message}")
        }

module ClaudeClient =
    let private messagesToPrompt (messages: ChatMessage array) =
        messages
        |> Array.map (fun msg ->
            let role =
                match msg with
                | :? SystemChatMessage -> "System"
                | :? UserChatMessage -> "User"
                | :? AssistantChatMessage -> "Assistant"
                | _ -> "User"

            let text =
                msg.Content
                |> Seq.tryHead
                |> Option.map (fun p -> p.Text)
                |> Option.defaultValue ""

            $"{role}: {text}")
        |> String.concat "\n\n"

    let complete modelId (messages: ChatMessage array) =
        task {
            try
                let prompt = messagesToPrompt messages

                let options =
                    { Options.defaults with
                        Model = Some modelId }

                let! result = Sdk.queryText prompt options

                match result with
                | Ok text -> return Ok(Option.defaultValue "" text)
                | Error err ->
                    match err with
                    | SdkError.Timeout _ -> return Error(RateLimited $"Timeout on {modelId}")
                    | SdkError.ProcessFailed(_, stderr) -> return Error(InternalError $"Claude failed: {stderr}")
                    | _ -> return Error(InternalError $"Claude completion failed: {err}")
            with ex ->
                return Error(InternalError $"Claude completion failed: {ex.Message}")
        }


let getKey (apiKeys: Config.LlmApiKeys) model =
    if ModelConfig.isGoogleModel model then
        apiKeys.GoogleAI |> Option.map (fun x -> GoogleKey x)
    elif ModelConfig.isGroqModel model then
        apiKeys.Groq |> Option.map (fun x -> Groq x)
    elif ModelConfig.isClaudeModel model then
        Some ClaudeKey
    else
        apiKeys.OpenRouter |> Option.map (fun x -> OpenRouter x)


let getAIClientHandlers key =
    match key with
    | ClaudeKey -> None, Some ClaudeClient.complete
    | GoogleKey k -> Some(GoogleAIClient.stream k), Some(GoogleAIClient.complete k)
    | OpenRouter _
    | Groq _ -> Some(OpenAIClient.stream key), Some(OpenAIClient.complete key)


module Service =
    open HypertweetServer.Tones

    let private resolveBaseModelInputs logger db userId =
        taskResult {
            let! user = DataAccess.user db userId
            let! profile = DataAccess.profile db userId
            logger |> Log.info "loading tones..."
            let! user = user |> Result.requireSome (NotFound "User")

            let model =
                match profile with
                | Some profile -> profile.ModelName
                | _ -> ModelConfig.defaultModel

            return model, user, profile
        }

    let private resolveModelInputs logger db toneId userId =
        taskResult {
            let! model, user, profile = resolveBaseModelInputs logger db userId
            let! userTones = DataAccess.userTones db userId
            logger |> Log.info "tones are loaded"
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
            .Replace(" ", " ")
            .Replace("‘", "'")
            .Replace("”", "\"")
            .Replace("…", "...")
            .Replace(
                """, "\"")
            .Replace(""",
                "\""
            )
            .Replace("'", "'")
            .Replace("'", "'")


    let refineMessage logger db apiKeys userId platform postMessage draftReply instruction =
        taskResult {
            let! model, user, profile = resolveBaseModelInputs logger db userId

            let userBio = profile |> Option.bind (fun x -> x.UserBio)
            let customReplyGuidance = profile |> Option.bind (fun x -> x.CustomReplyGuidance)

            let replyPromptOptions =
                profile
                |> Option.map (fun x -> x.ReplyPromptOptions)
                |> Option.defaultValue []
                |> List.choose ReplyPromptOption.tryParse

            let postProcessReply =
                profile |> Option.bind (fun x -> x.PostProcessReply) |> Option.defaultValue true

            let promptText =
                Prompts.RefinePrompt.make
                    platform
                    postMessage
                    draftReply
                    instruction
                    userBio
                    customReplyGuidance
                    replyPromptOptions

            let messages = [| ChatMessage.CreateUserMessage promptText :> ChatMessage |]

            let! providerKey =
                getKey apiKeys model
                |> Result.requireSome (InternalError $"No API key configured for model: {model}")

            let _, completeOpt = getAIClientHandlers providerKey

            let! complete =
                completeOpt
                |> Result.requireSome (InternalError $"No completion handler for model: {model}")

            let! completion, timeSpent = TracingUtils.measureTask (fun () -> complete model messages)

            let! completion =
                completion
                |> Result.map (fun x -> if postProcessReply then applyPostProcess x else x)

            let! evt =
                Tracing.saveRefineEvent
                    db
                    promptText
                    model
                    postMessage
                    draftReply
                    user
                    { TimeTookMs = int timeSpent.TotalMilliseconds
                      Reply = completion }

            return
                { EventId = evt.Id.ToString()
                  Reply = completion }
        }

    let generateReply logger db apiKeys (page: Page) toneId userId =
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

            let! providerKey =
                getKey apiKeys model
                |> Result.requireSome (InternalError $"No API key configured for model: {model}")

            let _, completeOpt = getAIClientHandlers providerKey

            let! complete =
                completeOpt
                |> Result.requireSome (InternalError $"No completion handler for model: {model}")

            let! completion, timeSpent = TracingUtils.measureTask (fun () -> complete model messages)

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

    type RefineRequest =
        { Platform: string
          OriginalPost: string
          DraftReply: string
          RefineInstruction: string }

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

    let chat db apiKeys next ctx =
        taskResult {
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
                |> Option.bind (fun p ->
                    match p.ChatModel with
                    | Some chatModel -> Some chatModel
                    | None -> Some p.ModelName)
                |> Option.defaultValue ModelConfig.defaultModel

            let! providerKey =
                getKey apiKeys model
                |> Result.requireSome (InternalError $"No API key configured for model: {model}")

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

            let streamOpt, completeOpt = getAIClientHandlers providerKey

            let! _ =
                match streamOpt with
                | Some stream ->
                    stream model messages (fun token ->
                        let processed = Service.applyPostProcess token
                        responseBuilder.Append processed |> ignore
                        SSE.writeJson ctx "token" processed)
                | None ->
                    match completeOpt with
                    | Some complete ->
                        task {
                            let! result = complete model messages

                            match result with
                            | Ok text ->
                                let processed = Service.applyPostProcess text
                                responseBuilder.Append processed |> ignore
                                do! SSE.writeJson ctx "token" processed
                                return Ok()
                            | Error e -> return Error e
                        }
                    | None ->
                        task { return Error(InternalError $"No handler available for model: {model}") }

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

    let refine db apiKeys next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx
            let! req = HttpCtx.bindJson<RefineRequest> ctx
            let logger = Log.http ctx
            logger |> Log.info "Refining reply"

            let! reply =
                Service.refineMessage
                    logger
                    db
                    apiKeys
                    userId
                    req.Platform
                    req.OriginalPost
                    req.DraftReply
                    req.RefineInstruction

            return! json reply next ctx
        }
        |> HttpCtx.errHandle next ctx

    let reply db apiKeys next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx
            let! req = HttpCtx.bindJson<ReplyRequest> ctx
            let logger = Log.http ctx
            logger |> Log.info "Generating reply"

            let! reply = Service.generateReply logger db apiKeys req.Page req.ToneId userId
            return! json reply next ctx
        }
        |> HttpCtx.errHandle next ctx

