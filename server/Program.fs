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

    let routes =
        choose
            [ // Public routes
              POST >=> route "/auth/register" >=> Auth.register db
              POST >=> route "/auth/login" >=> Auth.login config db
              POST >=> route "/auth/refresh" >=> Auth.refresh config db

              // Protected routes (require JWT)
              requiresAuthentication (challenge JwtBearerDefaults.AuthenticationScheme)
              >=> choose
                      [ POST >=> route "/profile/update" >=> Profiles.Handlers.updateProfile db
                        GET >=> route "/profile" >=> Profiles.Handlers.getProfile db
                        DELETE >=> route "/users" >=> Profiles.Handlers.deleteMe db
                        POST >=> route "/ai/reply" >=> AI.Handlers.reply db config.LlmApiKey
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
