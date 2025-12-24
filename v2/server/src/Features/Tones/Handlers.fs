namespace HypertweetServer.Features.Tones

open Giraffe
open HypertweetServer.Shared

module Handlers =
    open FsToolkit.ErrorHandling
    open Microsoft.AspNetCore.Http

    let private validateCreate (req: CreateToneRequest) =
        result {
            let! title = req.Title |> Validate.notEmpty "title"
            let! instruction = req.Instruction |> Validate.notEmpty "instruction"

            return
                { CreateToneCommand.Title = title
                  Instruction = instruction }
        }

    let private validateUpdate (req: UpdateToneRequest) =
        result {
            let! title = req.Title |> Validate.notEmpty "title"
            let! instruction = req.Instruction |> Validate.notEmpty "instruction"

            return
                { UpdateToneCommand.ToneId = ""
                  Title = title
                  Instruction = instruction }
        }

    let private run service onSuccess : HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger "Tones"
                let userId = HttpCtx.getUserId ctx

                match! service userId |> Async.StartAsTask with
                | Ok r -> return! onSuccess r next ctx
                | Error e -> return! Http.toHttp logger e next ctx
            }

    let private runWithBody validate service onSuccess : HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger "Tones"
                let userId = HttpCtx.getUserId ctx
                let! req = ctx.BindJsonAsync<_>()

                match validate req with
                | Error e -> return! Http.toHttp logger e next ctx
                | Ok cmd ->
                    match! service userId cmd |> Async.StartAsTask with
                    | Ok r -> return! onSuccess r next ctx
                    | Error e -> return! Http.toHttp logger e next ctx
            }

    let list deps =
        run (Service.list deps) (fun tones -> json (tones |> List.map ToneResponse.fromDomain))

    let create deps =
        runWithBody validateCreate (Service.create deps) (fun id -> Successful.created (json {| id = id |}))

    let update deps (toneId: string) =
        runWithBody
            (validateUpdate >> Result.map (fun cmd -> { cmd with ToneId = toneId }))
            (Service.update deps)
            (fun () -> Successful.ok (json {| message = "Updated" |}))

    let delete deps (toneId: string) =
        run (fun userId -> Service.delete deps userId toneId) (fun () -> Successful.ok (json {| message = "Deleted" |}))


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

    let toggleDefault deps (toneId: string) next (ctx: HttpContext) =
        let enabled =
            match HttpCtx.queryParam "enable" ctx with
            | HttpCtx.Value "true" -> true
            | HttpCtx.Value "false" -> false
            | _ -> true

        run
            (fun userId -> Service.toggleDefault deps userId toneId enabled)
            (fun () -> Successful.ok (json {| message = if enabled then "Enabled" else "Disabled" |}))
            next
            ctx

