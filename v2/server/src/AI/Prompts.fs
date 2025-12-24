module HypertweetServer.AI.Prompt

open FsToolkit.ErrorHandling
open HypertweetServer.Domain

module ModelConfig = HypertweetServer.Features.Profiles.ModelConfig

type Site =
    | X
    | Reddit
    | LinkedIn
    | Generic

let siteOfString (site: string) =
    match site with
    | s when s.Contains "twitter" || s.Contains "x.com" -> X
    | s when s.Contains "reddit" -> Reddit
    | s when s.Contains "linkedin" -> LinkedIn
    | _ -> Generic


module Formatters =
    let formatUser (user: PageUser) =
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

    let formatPost (post: Post) =
        let author = formatUser post.Author
        let time = post.Time |> Option.map (sprintf " (%s)") |> Option.defaultValue ""
        sprintf "**%s**%s:\n%s" author time post.Text

    let formatThread (posts: Post list) =
        posts |> List.map formatPost |> String.concat "\n\n---\n\n"



module ReplyPrompt =
    let private getPlatformGuidelines site =
        match site with
        | X ->
            """- Keep response under 280 characters unless thread format is appropriate
- Use casual, conversational tone typical of Twitter/X
- Hashtags are optional and should be used sparingly
- Emojis can enhance engagement but don't overuse"""
        | Reddit ->
            """- Match the subreddit's culture and tone
- Be informative and add value to the discussion
- Use markdown formatting (bold, lists, quotes) when helpful
- Avoid excessive self-promotion"""
        | LinkedIn ->
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
            |> Option.map Formatters.formatPost
            |> Option.defaultValue (
                page.Posts
                |> List.tryHead
                |> Option.map Formatters.formatPost
                |> Option.defaultValue "No post content"
            )

        let context =
            match page.Posts with
            | [] -> ""
            | posts -> sprintf "\n<thread_context>\n%s\n</thread_context>\n" (Formatters.formatThread posts)

        let platformGuidelines = getPlatformGuidelines (siteOfString page.Site)

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

