module HypertweetServer.Config

open System

type LlmApiKeys =
    { OpenRouter: string option
      GoogleAI: string option
      Groq: string option }

type t =
    { MongoConnectionString: string
      ApiKeys: LlmApiKeys
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
      ApiKeys =
        { OpenRouter = Environment.GetEnvironmentVariable "LLM_API_KEY" |> Option.ofObj
          GoogleAI = Environment.GetEnvironmentVariable "GOOGLE_AI_API_KEY" |> Option.ofObj
          Groq = Environment.GetEnvironmentVariable "GROQ_API_KEY" |> Option.ofObj }
      DatabaseName = "hypertweet"
      JwtSecret =
        Environment.GetEnvironmentVariable "JWT_SECRET"
        |> Option.ofObj
        |> Option.defaultValue "super-secret-key-change-in-production"
      JwtIssuer = "HyperTweet"
      JwtAudience = "HyperTweet"
      JwtExpiryDays = 7 }

