namespace HypertweetServer.AI

open FsToolkit.ErrorHandling
open HypertweetServer.Domain
open HypertweetServer.Shared

module ModelConfig = HypertweetServer.Features.Profiles.ModelConfig

type PageUser =
    { UserName: string option
      Email: string option
      Name: string option
      IsVerified: bool option
      Bio: string option
      Location: string option
      Website: string option
      JoinDate: string option
      Following: int option
      Followers: int option }

type Post =
    { Author: PageUser
      Text: string
      Replies: Post list option
      Time: string option
      StatusID: string option
      Url: string option
      Upvotes: int option
      CommentCount: int option
      IsTopLevel: bool option }

type Page =
    { Site: string
      Url: string
      Posts: Post list
      ActivePost: Post option }

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


module ReplyPrompt =
    let private formatUser (user: PageUser) =
        let parts =
            [ user.UserName |> Option.map (sprintf "@%s")
              user.Name
              user.Bio |> Option.map (sprintf "Bio: %s")
              user.Followers |> Option.map (sprintf "%d followers") ]
            |> List.choose id

        if List.isEmpty parts then
            "Unknown user"
        else
            String.concat " | " parts

    let private formatPost (post: Post) =
        let author = formatUser post.Author
        let time = post.Time |> Option.map (sprintf " (%s)") |> Option.defaultValue ""
        sprintf "**%s**%s:\n%s" author time post.Text

    let private formatThread (posts: Post list) =
        posts |> List.map formatPost |> String.concat "\n\n---\n\n"

    let private getPlatformGuidelines (site: string) =
        match site with
        | s when s.Contains "twitter" || s.Contains "x.com" ->
            """- Keep response under 280 characters unless thread format is appropriate
- Use casual, conversational tone typical of Twitter/X
- Hashtags are optional and should be used sparingly
- Emojis can enhance engagement but don't overuse"""
        | s when s.Contains "reddit" ->
            """- Match the subreddit's culture and tone
- Be informative and add value to the discussion
- Use markdown formatting (bold, lists, quotes) when helpful
- Avoid excessive self-promotion"""
        | s when s.Contains "linkedin" ->
            """- Maintain professional tone
- Add insights or professional perspective
- Be constructive and supportive
- Keep appropriate business context"""
        | _ ->
            """- Be helpful and relevant to the discussion
- Match the platform's general tone
- Keep response appropriately sized for the context"""

    let make (tone: Tone) (page: Page) =
        let activePost =
            page.ActivePost
            |> Option.map formatPost
            |> Option.defaultValue (
                page.Posts
                |> List.tryHead
                |> Option.map formatPost
                |> Option.defaultValue "No post content"
            )

        let context =
            match page.Posts with
            | [] -> ""
            | posts -> sprintf "\n<thread_context>\n%s\n</thread_context>\n" (formatThread posts)

        let platformGuidelines = getPlatformGuidelines page.Site

        $"""<task>
Generate a reply to the social media post below. Write ONLY the reply text, nothing else.
</task>

<platform>
Site: {page.Site}
URL: {page.Url}

Platform Guidelines:
{platformGuidelines}
</platform>

<tone_instruction>
Style: {tone.Title}
{tone.Instruction}
</tone_instruction>

<post_to_reply>
{activePost}
</post_to_reply>
{context}
<output_requirements>
- Write ONLY the reply text
- Do not include any meta-commentary, explanations, or formatting outside the reply
- Do not prefix with "Reply:" or similar labels
- Match the specified tone exactly
- Be authentic and engaging
</output_requirements>"""


module Service =
    open HypertweetServer.Features.Tones

    let private resolveModelInputs db toneId userId =
        taskResult {
            let! user = DataAccess.user db userId
            let! profile = DataAccess.profile db userId
            let! userTones = DataAccess.userTones db userId
            let! user = user |> Result.requireSome (NotFound "User")

            let model =
                match profile with
                | Some profile -> profile.ModelName
                | _ -> ModelConfig.defaultModel

            let dps = Service.makeResolvedTones user userTones

            let! tone =
                dps
                |> List.tryFind (fun x -> x.Id = toneId)
                |> Result.requireSome (NotFound "Tone")

            return tone, model
        }

    let generateReply db llmApiKey (page: Page) toneId userId =
        taskResult {
            let! tone, model = resolveModelInputs db toneId userId
            let prompt = ReplyPrompt.make tone page
            return! AI.getCompletion llmApiKey model prompt
        }

