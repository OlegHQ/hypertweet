namespace HypertweetServer.Shared

open Giraffe
open Microsoft.Extensions.Logging

module Http =
    let toHttp (logger: ILogger) =
        function
        | ValidationError(field, msg) -> RequestErrors.badRequest (json {| error = msg; field = field |})
        | NotFound entity -> RequestErrors.notFound (json {| error = $"{entity} not found" |})
        | Conflict msg -> RequestErrors.conflict (json {| error = msg |})
        | Unauthorized -> RequestErrors.unauthorized "Bearer" "HyperTweet" (json {| error = "Invalid credentials" |})
        | InternalError msg ->
            logger.LogError("Internal error: {Error}", msg)
            ServerErrors.internalError (json {| error = "Internal server error" |})

    let handler<'Req, 'Cmd, 'Resp>
        loggerName
        (validate: 'Req -> Result<'Cmd, DomainError>)
        (service: 'Cmd -> Async<Result<'Resp, DomainError>>)
        (onSuccess: 'Resp -> HttpHandler)
        : HttpHandler =
        fun next ctx ->
            task {
                let logger = ctx.GetLogger loggerName
                let! req = ctx.BindJsonAsync<'Req>()

                match validate req with
                | Error e -> return! toHttp logger e next ctx
                | Ok cmd ->
                    match! service cmd |> Async.StartAsTask with
                    | Ok r -> return! onSuccess r next ctx
                    | Error e -> return! toHttp logger e next ctx
            }
