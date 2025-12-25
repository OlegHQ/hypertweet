namespace HypertweetServer.Features.Profiles

open Giraffe
open HypertweetServer.Shared
open FsToolkit.ErrorHandling

type ModelDef = { ModelName: string }

type UpdateProfileInput =
    { NewPassword: string option
      ModelName: string option }

module ModelConfig =
    let allModels =
        [ "xiaomi/mimo-v2-flash:free"
          "tngtech/deepseek-r1t-chimera:free"
          "nex-agi/deepseek-v3.1-nex-n1:free"
          "deepseek/deepseek-r1-0528:free"
          "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
          "meta-llama/llama-3.1-405b-instruct:free"
          "openai/gpt-oss-20b:free" ]

    let defaultModel = "xiaomi/mimo-v2-flash:free"


module Handlers =
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

    open HypertweetServer

    let getProfile db next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx
            let! profile = DataAccess.profileCol db |> Db.findOne (DataAccess.idFilter userId)
            let! profile = profile |> Result.requireSome (NotFound "User")

            return! json profile next ctx
        }
        |> HttpCtx.errHandle next ctx

    let updateProfile db next ctx =
        taskResult {
            let! { NewPassword = newPassword
                   ModelName = modelName } = HttpCtx.bindJson<UpdateProfileInput> ctx

            do!
                match modelName with
                | Some x when not (List.contains x ModelConfig.allModels) ->
                    Error(ValidationError("ModelName", "Model is invalid"))
                | _ -> Ok()

            do!
                match newPassword with
                | Some x when not (x.Length >= 8) -> Error(ValidationError("NewPassword", " password is too short"))
                | _ -> Ok()

            let filter =
                let userId = HttpCtx.getUserId ctx
                Bson.make () |> Bson.field "_id" userId

            let! _ =
                let newPassword = newPassword |> Option.map BCrypt.Net.BCrypt.HashPassword

                match newPassword with
                | Some newPassword ->
                    let doc =
                        Bson.make ()
                        |> Bson.field "$set" (Bson.make () |> Bson.field "PasswordHash" newPassword)

                    let col = Db.collection db "users"
                    Db.updateOne filter doc col |> AsyncResult.map ignore
                | None -> AsyncResult.ok ()

            and! _ =
                if Option.isSome modelName then
                    let col = Db.collection db "profiles"

                    let update =
                        Bson.make ()
                        |> Bson.field "$set" (Bson.make () |> Bson.optionField "ModelName" modelName)

                    Db.upsertOne filter update col |> AsyncResult.map ignore
                else
                    AsyncResult.ok ()

            return! json {| Message = "Ok" |} next ctx
        }
        |> HttpCtx.errHandle next ctx

