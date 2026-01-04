module HypertweetServer.Prompts

open HypertweetServer.Models

open Base.PromptDsl.Domain
open Base.PromptDsl.Dsl

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

module Common =
    let getPlatformGuidelines site =
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

    let formatSiteContext (page: Page) =
        TextContent.Concat
            [ TextContent.LabeledText("Site", page.Site)
              TextContent.NewLine
              TextContent.LabeledText("URL", page.Url) ]

    let formatReplyPromptOption =
        function
        | ReplyPromptOption.NoEmojis -> "No emojis"
        | ReplyPromptOption.NoHashtags -> "No hash tags allowed"
        | ReplyPromptOption.NoPunctuation -> "loose punctuation"

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

    let formatPostWithDepth (depth: int) (post: Post) =
        let prefix = String.replicate depth "> "

        let author =
            post.Author.UserName
            |> Option.map (fun u -> if u.StartsWith("@") then u else "@" + u)
            |> Option.orElse post.Author.Name
            |> Option.defaultValue "Unknown"

        let time = post.Time |> Option.map (sprintf " (%s)") |> Option.defaultValue ""
        let header = sprintf "**%s**%s:" author time
        let textLines = post.Text.Split('\n') |> Array.map (fun line -> prefix + line)
        prefix + header + "\n" + (String.concat "\n" textLines)

    let rec formatThreadQuote (maxDepth: int) (maxReplies: int) (post: Post) (depth: int) : string list =
        if depth >= maxDepth then
            []
        else
            let current = formatPostWithDepth depth post
            let allReplies = post.Replies |> Option.defaultValue []
            let visibleReplies = allReplies |> List.truncate maxReplies

            let replies =
                visibleReplies
                |> List.collect (fun r -> formatThreadQuote maxDepth maxReplies r (depth + 1))

            let truncNote =
                let hidden = List.length allReplies - maxReplies

                if hidden > 0 then
                    [ String.replicate (depth + 1) "> " + sprintf "[+%d more]" hidden ]
                else
                    []

            current :: replies @ truncNote

    let formatThreadQuoteDefault post =
        formatThreadQuote DefaultMaxTreeDepth DefaultMaxRepliesPerLevel post 0


/// Extracted page context used by both reply and chat prompts
type PageContext =
    { ActivePost: string
      ThreadContext: string option
      CurrentDraft: string option
      PlatformGuidelines: string list }

module PageContext =
    let extract (page: Page) =
        let activePostObj =
            match page.Posts with
            | [ singlePost ] -> Some singlePost
            | [] -> None
            | _ -> page.ActivePost |> Option.orElse (List.tryHead page.Posts)

        let activePost =
            activePostObj
            |> Option.map Formatters.formatPost
            |> Option.defaultValue "No post content"

        let threadContext =
            match activePostObj with
            | None -> None
            | Some active ->
                let replies = active.Replies |> Option.defaultValue []

                match replies with
                | [] -> None
                | _ ->
                    let formatted =
                        replies
                        |> List.collect Formatters.formatThreadQuoteDefault
                        |> String.concat "\n\n"

                    match formatted with
                    | s when System.String.IsNullOrWhiteSpace s -> None
                    | s -> Some s

        let currentDraft =
            activePostObj
            |> Option.bind (fun p -> p.CurrentReplyDraft)
            |> Option.bind (fun d -> if System.String.IsNullOrWhiteSpace d then None else Some d)

        let platformGuidelines = Common.getPlatformGuidelines (siteOfString page.Site)

        { ActivePost = activePost
          ThreadContext = threadContext
          CurrentDraft = currentDraft
          PlatformGuidelines = platformGuidelines }

    let platformContextRich (page: Page) =
        TextContent.Concat
            [ TextContent.LabeledText("Site", page.Site)
              TextContent.NewLine
              TextContent.LabeledText("URL", page.Url)
              TextContent.NewLine
              TextContent.NewLine
              TextContent.TitledText("Platform Guidelines", TextContent.Empty) ]


module ReplyPrompt =
    let make (tone: Tone) (page: Page) userBio customReplyGuidance replyPromptOptions =
        let ctx = PageContext.extract page

        let taskInstruction =
            match ctx.CurrentDraft with
            | Some _ ->
                "Edit and refine the existing reply draft below to match the specified tone. Write ONLY the revised reply text, nothing else."
            | None -> "Generate a reply to the social media post below. Write ONLY the reply text, nothing else."

        prompt {
            Item.text taskInstruction |> xml "task" |> nl

            Item.rich (PageContext.platformContextRich page)
            Item.list ctx.PlatformGuidelines |> xml "platform" |> nl

            userBio |> Option.map (Item.text >> xml "user_bio" >> nl)

            Item.rich (
                TextContent.Concat
                    [ TextContent.LabeledText("Style", tone.Title)
                      TextContent.NewLine
                      TextContent.Text tone.Instruction ]
            )
            |> xml "tone_instruction"
            |> nl

            Item.text ctx.ActivePost |> xml "post_to_reply" |> nl

            ctx.ThreadContext |> Option.map (Item.text >> xml "thread_context" >> nl)

            Item.list (
                [ "Write ONLY the reply text"
                  "Do not include any meta-commentary, explanations, or formatting outside the reply"
                  "Do not prefix with \"Reply:\" or similar labels"
                  "Match the specified tone exactly"
                  "Be authentic and engaging" ]
                @ List.map Common.formatReplyPromptOption replyPromptOptions
            )
            |> xml "output_requirements"
            |> nl

            customReplyGuidance
            |> Option.map (Item.text >> xml "user_defined_guidance" >> nl)

            ctx.CurrentDraft |> Option.map (Item.text >> xml "current_draft_to_edit" >> nl)
        }


module ChatPrompt =
    let private defaultPersona =
        "You are an AI assistant helping users craft social media replies. "
        + "Help critique and improve draft replies. Be concise and actionable."

    let private formatChatOption =
        function
        | ReplyPromptOption.NoEmojis -> "User prefers no emojis"
        | ReplyPromptOption.NoHashtags -> "User prefers no hashtags"
        | ReplyPromptOption.NoPunctuation -> "User prefers loose punctuation"

    let make (persona: string option) (page: Page) userBio replyPromptOptions =
        let ctx = PageContext.extract page

        prompt {
            Item.text (persona |> Option.defaultValue defaultPersona) |> nl

            Item.rich (PageContext.platformContextRich page)

            userBio |> Option.map (Item.text >> xml "user_bio" >> nl)

            Item.text ctx.ActivePost |> xml "post_to_reply" |> nl

            ctx.ThreadContext |> Option.map (Item.text >> xml "thread_context" >> nl)

            ctx.CurrentDraft |> Option.map (Item.text >> xml "current_draft" >> nl)

            Item.list (List.map formatChatOption replyPromptOptions) |> xml "guidelines" |> nl

            Item.list
                [ "When providing a ready-to-use reply, wrap it in a ```reply code block"
                  "Only use ```reply for final, ready-to-paste text - not for examples or drafts being discussed" ]
            |> xml "output_format"
        }

