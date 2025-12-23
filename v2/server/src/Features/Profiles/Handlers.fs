namespace HypertweetServer.Features.Profiles

open Giraffe
open HypertweetServer.Shared
open FsToolkit.ErrorHandling

type ModelDef = { ModelName: string }

type UpdateProfileInput =
    { NewPassword: string option
      ModelName: string option }

module Handlers =
    let private models =
        [ "xiaomi/mimo-v2-flash:free"; "tngtech/deepseek-r1t-chimera:free" ]

    let listModels next ctx =
        json (List.map (fun x -> { ModelName = x }) models) next ctx

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

    let updateProfile db next ctx =
        taskResult {
            let! { NewPassword = newPassword
                   ModelName = modelName } = HttpCtx.bindJson<UpdateProfileInput> ctx

            do!
                match modelName with
                | Some x when not (List.contains x models) -> Error(ValidationError("ModelName", "Model is invalid"))
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
