module Program

open System.Text
open System.Text.Json
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Authentication.JwtBearer
open Microsoft.Extensions.DependencyInjection
open Microsoft.IdentityModel.Tokens
open Giraffe
open HypertweetServer.Shared
open HypertweetServer.Data
open HypertweetServer.Infrastructure
open HypertweetServer.Features.Auth
open HypertweetServer.Features.Tones

module TonesHandlers = Handlers
module TonesRepo = Repository

[<EntryPoint>]
let main args =
    let config = Config.load ()
    let db = Database.connect config

    // Auth feature deps (uses shared UserRepository)
    let authDeps: AuthDeps =
        { FindUserByEmail = UserRepository.findByEmail db
          InsertUser = UserRepository.insert db
          FindByRefreshToken = UserRepository.findByRefreshToken db
          UpdateRefreshToken = UserRepository.updateRefreshToken db
          HashPassword = BCrypt.Net.BCrypt.HashPassword
          VerifyPassword = fun plain hash -> BCrypt.Net.BCrypt.Verify(plain, hash)
          GenerateAccessToken = Jwt.generateToken config
          GenerateRefreshToken = Jwt.generateRefreshToken
          TokenExpirySeconds = config.JwtExpiryDays * 24 * 60 * 60 }

    // Tones feature deps (uses shared UserRepository + feature-specific Repository)
    let toneDeps: ToneDeps =
        { GetUser = UserRepository.findById db
          UpdateUser = UserRepository.update db
          FindToneById = TonesRepo.findById db
          FindTonesByUser = TonesRepo.findByUser db
          InsertTone = TonesRepo.insert db
          UpdateTone = TonesRepo.update db
          DeleteTone = TonesRepo.delete db }

    let routes =
        choose
            [ // Public routes
              POST >=> route "/auth/register" >=> Handlers.register authDeps
              POST >=> route "/auth/login" >=> Handlers.login authDeps
              POST >=> route "/auth/refresh" >=> Handlers.refresh authDeps

              // Protected routes (require JWT)
              requiresAuthentication (challenge JwtBearerDefaults.AuthenticationScheme)
              >=> choose
                      [ GET >=> route "/tones" >=> TonesHandlers.list toneDeps
                        POST >=> route "/tones" >=> TonesHandlers.create toneDeps
                        PUT >=> routef "/tones/%s" (fun id -> TonesHandlers.update toneDeps id)
                        DELETE >=> routef "/tones/%s" (fun id -> TonesHandlers.delete toneDeps id)
                        POST
                        >=> routef "/tones/%s/toggle" (fun id -> TonesHandlers.toggleDefault toneDeps id) ] ]

    let builder = WebApplication.CreateBuilder args

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
    builder.Services.AddSingleton<Json.ISerializer>(Json.Serializer(jsonOptions)) |> ignore

    let app = builder.Build()
    app.UseCors() |> ignore
    app.UseAuthentication() |> ignore
    app.UseGiraffe routes
    app.Run "http://0.0.0.0:5001"
    0

