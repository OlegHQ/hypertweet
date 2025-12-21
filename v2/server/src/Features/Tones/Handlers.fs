namespace HypertweetServer.Features.Tones

open Giraffe
open HypertweetServer.Domain
open HypertweetServer.Shared

module Handlers =
    let private validateCreate (req: CreateToneRequest) =
        result {
            let! title = req.Title |> Validate.notEmpty "title"
            let! instruction = req.Instruction |> Validate.notEmpty "instruction"
            return { CreateToneCommand.Title = title; Instruction = instruction }
        }

    let private validateUpdate (req: UpdateToneRequest) =
        result {
            let! title = req.Title |> Validate.notEmpty "title"
            let! instruction = req.Instruction |> Validate.notEmpty "instruction"
            return { UpdateToneCommand.ToneId = ToneId ""; Title = title; Instruction = instruction }
        }

    let private run service onSuccess : HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger "Tones"
                let userId = Http.getUserId ctx

                match! service userId |> Async.StartAsTask with
                | Ok r -> return! onSuccess r next ctx
                | Error e -> return! Http.toHttp logger e next ctx
            }

    let private runWithBody validate service onSuccess : HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger "Tones"
                let userId = Http.getUserId ctx
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
            (validateUpdate >> Result.map (fun cmd -> { cmd with ToneId = ToneId toneId }))
            (Service.update deps)
            (fun () -> Successful.ok (json {| message = "Updated" |}))

    let delete deps (toneId: string) =
        run (fun userId -> Service.delete deps userId (ToneId toneId)) (fun () -> Successful.ok (json {| message = "Deleted" |}))

    let toggleDefault deps (toneId: string) : HttpHandler =
        fun next ctx ->
            let enabled = ctx.Request.Query.ContainsKey("enable")
            run
                (fun userId -> Service.toggleDefault deps userId (ToneId toneId) enabled)
                (fun () -> Successful.ok (json {| message = if enabled then "Enabled" else "Disabled" |}))
                next ctx
