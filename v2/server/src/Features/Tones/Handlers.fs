namespace HypertweetServer.Features.Tones

open System
open System.Security.Claims
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.Logging
open Giraffe
open HypertweetServer.Domain
open HypertweetServer.Shared

module Handlers =
    let private toHttp (logger: ILogger) =
        function
        | ValidationError(field, msg) -> RequestErrors.badRequest (json {| error = msg; field = field |})
        | NotFound entity -> RequestErrors.notFound (json {| error = $"{entity} not found" |})
        | Conflict msg -> RequestErrors.conflict (json {| error = msg |})
        | Unauthorized -> RequestErrors.unauthorized "Bearer" "HyperTweet" (json {| error = "Unauthorized" |})
        | InternalError msg ->
            logger.LogError("Internal error: {Error}", msg)
            ServerErrors.internalError (json {| error = "Internal server error" |})

    let private getUserId (ctx: HttpContext) =
        let claim = ctx.User.FindFirst(ClaimTypes.NameIdentifier)
        UserId claim.Value

    let private validateCreate (req: CreateToneRequest) =
        result {
            do!
                if String.IsNullOrWhiteSpace req.Title then
                    Error(ValidationError("title", "required"))
                else
                    Ok()

            do!
                if String.IsNullOrWhiteSpace req.Instruction then
                    Error(ValidationError("instruction", "required"))
                else
                    Ok()

            return { CreateToneCommand.Title = req.Title; Instruction = req.Instruction }
        }

    let private validateUpdate (req: UpdateToneRequest) =
        result {
            do!
                if String.IsNullOrWhiteSpace req.Title then
                    Error(ValidationError("title", "required"))
                else
                    Ok()

            do!
                if String.IsNullOrWhiteSpace req.Instruction then
                    Error(ValidationError("instruction", "required"))
                else
                    Ok()

            return (req.Title, req.Instruction)
        }

    let list deps: HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger("Tones")
                let userId = getUserId ctx

                match! Service.list deps userId |> Async.StartAsTask with
                | Ok tones ->
                    return! json (tones |> List.map ToneResponse.fromDomain) next ctx
                | Error e -> return! toHttp logger e next ctx
            }

    let create deps: HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger("Tones")
                let! req = ctx.BindJsonAsync<CreateToneRequest>()
                let userId = getUserId ctx

                match validateCreate req with
                | Error e -> return! toHttp logger e next ctx
                | Ok cmd ->
                    match! Service.create deps userId cmd |> Async.StartAsTask with
                    | Ok id -> return! Successful.created (json {| id = id |}) next ctx
                    | Error e -> return! toHttp logger e next ctx
            }

    let update deps (toneId: string): HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger("Tones")
                let! req = ctx.BindJsonAsync<UpdateToneRequest>()
                let userId = getUserId ctx

                match validateUpdate req with
                | Error e -> return! toHttp logger e next ctx
                | Ok(title, instruction) ->
                    let cmd =
                        { UpdateToneCommand.ToneId = ToneId toneId
                          Title = title
                          Instruction = instruction }

                    match! Service.update deps userId cmd |> Async.StartAsTask with
                    | Ok() -> return! Successful.ok (json {| message = "Updated" |}) next ctx
                    | Error e -> return! toHttp logger e next ctx
            }

    let delete deps (toneId: string): HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger("Tones")
                let userId = getUserId ctx

                match! Service.delete deps userId (ToneId toneId) |> Async.StartAsTask with
                | Ok() -> return! Successful.ok (json {| message = "Deleted" |}) next ctx
                | Error e -> return! toHttp logger e next ctx
            }

    let toggleDefault deps (toneId: string): HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger("Tones")
                let userId = getUserId ctx
                let enabled = ctx.Request.Query.ContainsKey("enable")

                match! Service.toggleDefault deps userId (ToneId toneId) enabled |> Async.StartAsTask with
                | Ok() -> return! Successful.ok (json {| message = if enabled then "Enabled" else "Disabled" |}) next ctx
                | Error e -> return! toHttp logger e next ctx
            }
