module HypertweetServer.AI.Prompts

open HypertweetServer.Domain
open HypertweetServer.AI.PromptBuilder
open PromptDomain
open Dsl

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
            [ "Keep response under 280 characters unless thread format is appropriate"
              "Use casual, conversational tone typical of Twitter/X"
              "Hashtags are optional and should be used sparingly"
              "Emojis can enhance engagement but don't overuse" ]
        | Reddit ->
            [ "Match the subreddit's culture and tone"
              "Be informative and add value to the discussion"
              "Use markdown formatting (bold, lists, quotes) when helpful"
              "Avoid excessive self-promotion" ]
        | LinkedIn ->
            [ "Maintain professional tone"
              "Add insights or professional perspective"
              "Be constructive and supportive"
              "Keep appropriate business context" ]
        | Generic ->
            [ "Be helpful and relevant to the discussion"
              "Match the platform's general tone"
              "Keep response appropriately sized for the context" ]

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

        let platformGuidelines = getPlatformGuidelines (siteOfString page.Site)

        let threadContext =
            match page.Posts with
            | [] -> None
            | posts -> Some(Formatters.formatThread posts)

        prompt {
            Item.text "Generate a reply to the social media post below. Write ONLY the reply text, nothing else."
            |> xml "task"
            |> nl

            Item.rich (
                TextContent.Concat
                    [ TextContent.LabeledText("Site", page.Site)
                      TextContent.NewLine
                      TextContent.LabeledText("URL", page.Url)
                      TextContent.NewLine
                      TextContent.NewLine
                      TextContent.TitledText("Platform Guidelines", TextContent.Empty) ]
            )

            Item.list platformGuidelines |> xml "platform" |> nl

            Item.rich (
                TextContent.Concat
                    [ TextContent.LabeledText("Style", tone.Title)
                      TextContent.NewLine
                      TextContent.Text tone.Instruction ]
            )
            |> xml "tone_instruction"
            |> nl

            Item.text activePost |> xml "post_to_reply" |> nl

            threadContext |> Option.map (Item.text >> xml "thread_context" >> nl)

            Item.list
                [ "Write ONLY the reply text"
                  "Do not include any meta-commentary, explanations, or formatting outside the reply"
                  "Do not prefix with \"Reply:\" or similar labels"
                  "Match the specified tone exactly"
                  "Be authentic and engaging" ]
            |> xml "output_requirements"
        }

