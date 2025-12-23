namespace HypertweetServer.Shared

open Serilog
open Microsoft.AspNetCore.Http

module Log =
    type Ctx = ILogger

    let http (ctx: HttpContext) =
        Log.Logger
            .ForContext("path", ctx.Request.Path.Value)
            .ForContext("method", ctx.Request.Method)
            .ForContext("traceId", ctx.TraceIdentifier)

    let attr key value (logger: Ctx) = logger.ForContext(key, value)

    let info msg (logger: Ctx) = logger.Information msg
    let warn msg (logger: Ctx) = logger.Warning msg
    let error msg (logger: Ctx) = logger.Error msg
    let debug msg (logger: Ctx) = logger.Debug msg
