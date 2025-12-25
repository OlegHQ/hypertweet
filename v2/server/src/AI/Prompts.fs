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
    [<Literal>]
    let DefaultMaxTreeDepth = 3

    [<Literal>]
    let DefaultMaxRepliesPerLevel = 5

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

    let formatPostCompact (post: Post) =
        let author =
            post.Author.UserName
            |> Option.map (sprintf "@%s")
            |> Option.orElse post.Author.Name
            |> Option.defaultValue "Unknown"
        sprintf "%s: %s" author post.Text

    let formatThreadTree (maxDepth: int) (maxReplies: int) (post: Post) : string =
        let rec format (p: Post) (depth: int) (indent: string) =
            if depth >= maxDepth then
                ""
            else
                let header =
                    if depth = 0 then formatPost p
                    else sprintf "%s↳ %s" indent (formatPostCompact p)

                let allReplies = p.Replies |> Option.defaultValue []
                let visibleReplies = allReplies |> List.truncate maxReplies
                let nextIndent = indent + "  "

                let childTexts =
                    visibleReplies
                    |> List.map (fun r -> format r (depth + 1) nextIndent)
                    |> List.filter (System.String.IsNullOrWhiteSpace >> not)

                let truncNote =
                    let hidden = List.length allReplies - maxReplies
                    if hidden > 0 then sprintf "\n%s[+%d more replies]" indent hidden
                    else ""

                match childTexts with
                | [] -> header
                | children -> header + "\n" + (String.concat "\n" children) + truncNote

        format post 0 ""

    let formatThreadTreeDefault = formatThreadTree DefaultMaxTreeDepth DefaultMaxRepliesPerLevel


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
        let activePostObj =
            match page.Posts with
            | [ singlePost ] -> Some singlePost
            | [] -> None
            | _ -> page.ActivePost |> Option.orElse (List.tryHead page.Posts)

        let activePost =
            activePostObj
            |> Option.map Formatters.formatPost
            |> Option.defaultValue "No post content"

        let platformGuidelines = getPlatformGuidelines (siteOfString page.Site)

        let threadContext =
            match page.Posts with
            | [] -> None
            | posts ->
                let formatted =
                    posts
                    |> List.map Formatters.formatThreadTreeDefault
                    |> String.concat "\n\n---\n\n"
                match formatted with
                | s when System.String.IsNullOrWhiteSpace s -> None
                | s -> Some s

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

