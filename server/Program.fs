module Program

open System.Text
open System.Text.Json
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Authentication.JwtBearer
open Microsoft.Extensions.DependencyInjection
open Microsoft.IdentityModel.Tokens
open Giraffe
open HypertweetServer.Shared
open HypertweetServer.Features.Auth
open HypertweetServer.Features.Tones
open Serilog

module TonesHandlers = Handlers
module ProfileHandlers = HypertweetServer.Features.Profiles.Handlers
module AIHandlers = HypertweetServer.AI.Handlers

[<EntryPoint>]
let main args =
    Log.Logger <-
        LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.Console(theme = Sinks.SystemConsole.Themes.AnsiConsoleTheme.Sixteen)
            .CreateLogger()

    let config = Config.load ()
    let db = Db.connect config

    let routes =
        choose
            [ // Public routes
              POST >=> route "/auth/register" >=> Handlers.register db
              POST >=> route "/auth/login" >=> Handlers.login config db
              POST >=> route "/auth/refresh" >=> Handlers.refresh config db

              // Protected routes (require JWT)
              requiresAuthentication (challenge JwtBearerDefaults.AuthenticationScheme)
              >=> choose
                      [ POST >=> route "/profile/update" >=> ProfileHandlers.updateProfile db
                        GET >=> route "/profile" >=> ProfileHandlers.getProfile db
                        DELETE >=> route "/users" >=> ProfileHandlers.deleteMe db
                        POST >=> route "/ai/reply" >=> AIHandlers.reply db config.LlmApiKey
                        GET >=> route "/profile/available-models" >=> ProfileHandlers.listModels
                        GET >=> route "/tones" >=> TonesHandlers.list db
                        POST >=> route "/tones" >=> TonesHandlers.create db
                        PUT >=> routef "/tones/%s" (TonesHandlers.update db)
                        DELETE >=> routef "/tones/%s" (TonesHandlers.delete db)
                        POST >=> routef "/tones/%s/toggle" (TonesHandlers.toggleDefault db) ] ]

    let builder = WebApplication.CreateBuilder args
    builder.Host.UseSerilog() |> ignore

    builder.Services.AddCors(fun options ->
        options.AddDefaultPolicy(fun policy -> policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader() |> ignore))
    |> ignore

    // Configure JWT authentication
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

    // Configure JSON serializer with case-insensitive property matching
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

