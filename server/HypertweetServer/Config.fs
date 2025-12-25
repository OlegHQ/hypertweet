module HypertweetServer.Config

open System

type AppConfig =
    { MongoConnectionString: string
      LlmApiKey: string option
      DatabaseName: string
      JwtSecret: string
      JwtIssuer: string
      JwtAudience: string
      JwtExpiryDays: int }

let load () =
    { MongoConnectionString =
        Environment.GetEnvironmentVariable "MONGODB_URI"
        |> Option.ofObj
        |> Option.defaultValue "mongodb://localhost:27017"
      LlmApiKey = Environment.GetEnvironmentVariable "LLM_API_KEY" |> Option.ofObj
      DatabaseName = "hypertweet"
      JwtSecret =
        Environment.GetEnvironmentVariable "JWT_SECRET"
        |> Option.ofObj
        |> Option.defaultValue "super-secret-key-change-in-production"
      JwtIssuer = "HyperTweet"
      JwtAudience = "HyperTweet"
      JwtExpiryDays = 7 }
