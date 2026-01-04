module Program

open System.Text
open System.Text.Json
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Authentication.JwtBearer
open Microsoft.Extensions.DependencyInjection
open Microsoft.IdentityModel.Tokens
open Giraffe
open Base
open Base.Common
open HypertweetServer
open Serilog

[<EntryPoint>]
let main args =
    Log.Logger <-
        LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.Console(theme = Sinks.SystemConsole.Themes.AnsiConsoleTheme.Sixteen)
            .CreateLogger()

    let config = Config.load ()
    let db = Db.connect config.MongoConnectionString config.DatabaseName

    Log.Information "Generating database indexes..."

    match DataAccess.generateIndexes db |> Async.AwaitTask |> Async.RunSynchronously with
    | Ok() -> Log.Information "Database indexes generated"
    | Error err -> Log.Error("Failed to generate indexes: {Error}", err)

    let routes =
        choose
            [ // Health check
              GET >=> route "/" >=> text "working"

              // Public routes
              POST >=> route "/auth/register" >=> Auth.Handlers.register db
              POST >=> route "/auth/login" >=> Auth.Handlers.login config db
              POST >=> route "/auth/refresh" >=> Auth.Handlers.refresh config db

              // Protected routes (require JWT)
              requiresAuthentication (challenge JwtBearerDefaults.AuthenticationScheme)
              >=> choose
                      [ POST >=> route "/profile/password" >=> Profiles.Handlers.updatePassword db
                        POST >=> route "/profile/update" >=> Profiles.Handlers.updateProfile db
                        GET >=> route "/profile" >=> Profiles.Handlers.getProfile db
                        DELETE >=> route "/users" >=> Profiles.Handlers.deleteMe db
                        POST >=> route "/ai/refine" >=> AI.Handlers.refine db config.LlmApiKey
                        POST >=> route "/ai/reply" >=> AI.Handlers.reply db config.LlmApiKey
                        POST >=> route "/ai/chat" >=> AI.Handlers.chat db config.LlmApiKey
                        GET >=> route "/profile/available-models" >=> Profiles.Handlers.listModels
                        GET >=> route "/tones" >=> Tones.Handlers.list db
                        POST >=> route "/tones" >=> Tones.Handlers.create db
                        PUT >=> routef "/tones/%s" (Tones.Handlers.update db)
                        DELETE >=> routef "/tones/%s" (Tones.Handlers.delete db)
                        POST >=> routef "/tones/%s/toggle" (Tones.Handlers.toggleDefault db) ] ]

    let builder = WebApplication.CreateBuilder args
    builder.Host.UseSerilog() |> ignore

    builder.Services.AddCors(fun options ->
        options.AddDefaultPolicy(fun policy -> policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader() |> ignore))
    |> ignore

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(fun options ->
            options.TokenValidationParameters <-
                TokenValidationParameters(
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config.JwtIssuer,
                    ValidAudience = config.JwtAudience,
                    IssuerSigningKey = SymmetricSecurityKey(Encoding.UTF8.GetBytes config.JwtSecret)
                ))
    |> ignore

    let jsonOptions = JsonSerializerOptions(PropertyNameCaseInsensitive = true)
    builder.Services.AddGiraffe() |> ignore

    builder.Services.AddSingleton<Json.ISerializer>(Json.Serializer jsonOptions)
    |> ignore

    let app = builder.Build()
    app.UseCors() |> ignore
    app.UseAuthentication() |> ignore
    app.UseGiraffe routes
    app.Run "http://0.0.0.0:5001"
    0

