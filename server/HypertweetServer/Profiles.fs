module HypertweetServer.Profiles

open Giraffe
open Base
open Base.Common
open FsToolkit.ErrorHandling
open MongoDB.Bson

type ModelDef = { ModelName: string }

module ModelConfig =
    let allModels =
        [ "xiaomi/mimo-v2-flash:free"
          "tngtech/deepseek-r1t-chimera:free"
          "nex-agi/deepseek-v3.1-nex-n1:free"
          "deepseek/deepseek-r1-0528:free"
          "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
          "meta-llama/llama-3.1-405b-instruct:free"
          // "openai/gpt-oss-120b:free"
          // "openai/gpt-oss-20b:free"
          "openai/gpt-oss-120b"
          "openai/gpt-oss-20b"
          "gemini-3-pro-preview"
          "gemini-3-flash-preview"
          "claude-sonnet-4-5-20250929"
          "claude-haiku-4-5-20251001"
          "claude-opus-4-5-20251101" ]

    let defaultModel = "xiaomi/mimo-v2-flash:free"

    let isGroqModel (model: string) = model.StartsWith "openai/gpt"
    let isClaudeModel (model: string) = model.StartsWith "claude-"
    let isGoogleModel (model: string) = model.StartsWith "gemini-"


module UpdateProfileInput =
    type Input =
        { UserBio: string option
          CustomReplyGuidance: string option
          PostProcessReply: bool option
          ReplyPromptOptions: string list option
          ModelName: string option
          ChatModel: string option
          ChatBotPersona: string option }

    type Variant =
        | UserBio of string
        | CustomReplyGuidance of string
        | PostProcessReply of bool
        | ReplyPromptOptions of Models.ReplyPromptOption.T list
        | ModelName of string
        | ChatModel of string
        | ChatBotPersona of string
        | Combined of Variant list

    let validateList (options: string list) : Result<Models.ReplyPromptOption.T list, DomainError> =
        options
        |> List.traverseResultM (fun s ->
            Models.ReplyPromptOption.tryParse s
            |> Result.requireSome (ValidationError("ReplyPromptOptions", $"Invalid option: {s}")))

    let variantOfInput (input: Input) : Result<Variant option, DomainError> =
        result {
            let! replyOpts =
                match input.ReplyPromptOptions with
                | Some opts -> validateList opts |> Result.map Some
                | None -> Ok None

            let variants =
                [ input.UserBio |> Option.map UserBio
                  input.CustomReplyGuidance |> Option.map CustomReplyGuidance
                  input.PostProcessReply |> Option.map PostProcessReply
                  replyOpts |> Option.map ReplyPromptOptions
                  input.ModelName |> Option.map ModelName
                  input.ChatModel |> Option.map ChatModel
                  input.ChatBotPersona |> Option.map ChatBotPersona ]
                |> List.choose id

            return
                match variants with
                | [] -> None
                | [ single ] -> Some single
                | multiple -> Some(Combined multiple)
        }

    let rec buildUpdateDoc (variant: Variant) (doc: BsonDocument) : BsonDocument =
        match variant with
        | UserBio v -> doc |> Bson.field "UserBio" v
        | CustomReplyGuidance v -> doc |> Bson.field "CustomReplyGuidance" v
        | PostProcessReply v -> doc |> Bson.field "PostProcessReply" v
        | ReplyPromptOptions opts ->
            doc
            |> Bson.field "ReplyPromptOptions" (opts |> List.map Models.ReplyPromptOption.toString)
        | ModelName v -> doc |> Bson.field "ModelName" v
        | ChatModel v -> doc |> Bson.field "ChatModel" v
        | ChatBotPersona v -> doc |> Bson.field "ChatBotPersona" v
        | Combined variants -> variants |> List.fold (fun acc v -> buildUpdateDoc v acc) doc

    let rec validateVariant (variant: Variant) : Result<Variant, DomainError> =
        match variant with
        | ModelName m when not (List.contains m ModelConfig.allModels) ->
            Error(ValidationError("ModelName", "Model is invalid"))
        | ChatModel m when not (List.contains m ModelConfig.allModels) ->
            Error(ValidationError("ChatModel", "Chat model is invalid"))
        | Combined variants -> variants |> List.traverseResultM validateVariant |> Result.map Combined
        | other -> Ok other

[<CLIMutable>]
type UpdatePasswordInput = { NewPassword: string }

let upsertProfile variantOpt userId db =
    taskResult {

        let! variant =
            variantOpt
            |> Result.requireSome (ValidationError("input", "No fields to update"))

        let! validVariant = UpdateProfileInput.validateVariant variant

        let filter = Bson.make () |> Bson.field "_id" userId
        let setDoc = UpdateProfileInput.buildUpdateDoc validVariant (Bson.make ())
        let update = Bson.make () |> Bson.field "$set" setDoc

        do! DataAccess.profileCol db |> Db.upsertOne filter update |> AsyncResult.map ignore
    }

module Handlers =
    open HypertweetServer

    let listModels next ctx =
        let allModels = List.map (fun x -> { ModelName = x }) ModelConfig.allModels

        json
            {| DefaultModel = ModelConfig.defaultModel
               AllModels = allModels |}
            next
            ctx

    let deleteMe db next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx

            do!
                Db.collection db "users"
                |> Db.deleteOne (Bson.make () |> Bson.field "_id" userId)
                |> AsyncResult.map ignore

            return! json {| Message = "Ok" |} next ctx
        }
        |> HttpCtx.errHandle next ctx


    let getProfile db next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx
            let! profile = DataAccess.profileCol db |> Db.findOne (DataAccess.idFilter userId)

            do!
                match profile with
                | None ->
                    let defaultOpt =
                        UpdateProfileInput.Combined
                            [ UpdateProfileInput.PostProcessReply true
                              UpdateProfileInput.ReplyPromptOptions
                                  [ Models.ReplyPromptOption.NoEmojis; Models.ReplyPromptOption.NoHashtags ] ]

                    upsertProfile (Some defaultOpt) userId db
                | _ -> TaskResult.ok ()

            let! profile = DataAccess.profileCol db |> Db.findOne (DataAccess.idFilter userId)

            return! json profile next ctx
        }
        |> HttpCtx.errHandle next ctx

    let updateProfile db next ctx =
        taskResult {
            let! input = HttpCtx.bindJson<UpdateProfileInput.Input> ctx

            let userId = HttpCtx.getUserId ctx
            let! variantOpt = input |> UpdateProfileInput.variantOfInput
            do! upsertProfile variantOpt userId db

            return! json {| Message = "Ok" |} next ctx
        }
        |> HttpCtx.errHandle next ctx

    let updatePassword db next ctx =
        taskResult {
            let! { NewPassword = newPassword } = HttpCtx.bindJson<UpdatePasswordInput> ctx
            let! _ = newPassword |> Validate.minLength "NewPassword" 8

            let filter = Bson.make () |> Bson.field "_id" (HttpCtx.getUserId ctx)
            let hash = BCrypt.Net.BCrypt.HashPassword newPassword

            let update =
                Bson.make ()
                |> Bson.field "$set" (Bson.make () |> Bson.field "PasswordHash" hash)

            do! DataAccess.userCol db |> Db.updateOne filter update |> AsyncResult.map ignore

            return! json {| Message = "Ok" |} next ctx
        }
        |> HttpCtx.errHandle next ctx

