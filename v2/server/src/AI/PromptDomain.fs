module HypertweetServer.AI.PromptBuilder

module PromptDomain =

    // 1. Low-level text components
    module TextContent =
        type t =
            | Empty
            | Text of string
            | Concat of t list
            | NewLine
            | LabeledText of label: string * content: string
            | TitledText of title: string * body: t

        // Helper to combine items cleanly
        let (+) a b = Concat [ a; b ]

    // 2. High-level Blocks (Paragraphs, Lists, Sections)
    module Item =
        type Content =
            | Inline of TextContent.t
            | BulletList of string list

        type t =
            { Content: Content
              HasNewLine: bool
              XMLTagName: string option }

        // Constructors
        let text t =
            { Content = Inline(TextContent.Text t)
              HasNewLine = false
              XMLTagName = None }

        let rich t =
            { Content = Inline t
              HasNewLine = false
              XMLTagName = None }

        let list l =
            { Content = BulletList l
              HasNewLine = false
              XMLTagName = None }

        // Modifiers
        let withNewLine x = { x with HasNewLine = true }
        let withXmlTag tag x = { x with XMLTagName = Some tag }

module Render =
    open PromptDomain

    // Helper to indent if you want pretty-printed XML later
    let private wrapXml tag content =
        match tag with
        | None -> content
        | Some t -> sprintf "<%s>\n%s\n</%s>" t content t

    let rec renderText (t: TextContent.t) : string =
        match t with
        | TextContent.Empty -> ""
        | TextContent.Text s -> s
        | TextContent.NewLine -> "\n"
        | TextContent.Concat items -> items |> List.map renderText |> String.concat ""
        | TextContent.LabeledText(label, content) -> sprintf "%s: %s" label content
        | TextContent.TitledText(title, body) -> sprintf "### %s\n%s" title (renderText body)

    let renderItem (item: Item.t) : string =
        let rawContent =
            match item.Content with
            | Item.Inline t -> renderText t
            | Item.BulletList items -> items |> List.map (sprintf "- %s") |> String.concat "\n"

        let withXml = wrapXml item.XMLTagName rawContent

        if item.HasNewLine then withXml + "\n" else withXml

module Dsl =
    open PromptDomain

    type PromptBuilder() =
        // The internal state is just a list of Items
        member _.Yield(item: Item.t) = [ item ]

        // Overload to allow yielding raw strings as Text items automatically
        member _.Yield(str: string) = [ Item.text str ]

        // Overload to handle Option<Item.t> - None yields nothing
        member _.Yield(item: Item.t option) =
            match item with
            | Some i -> [ i ]
            | None -> []

        // Combine operations (binds lines together)
        member _.Combine(a, b) = a @ b
        member _.Zero() = []
        member _.Delay(f) = f ()

        // Used to "Run" the builder at the end
        member _.Run(items: Item.t list) =
            items |> List.map Render.renderItem |> String.concat "\n"

    let prompt = PromptBuilder()

    // Fluent helpers for inside the builder
    let nl = Item.withNewLine
    let xml tag = Item.withXmlTag tag

