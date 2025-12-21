namespace HypertweetServer.Shared

open System

type AppConfig =
    { MongoConnectionString: string
      DatabaseName: string
      JwtSecret: string
      JwtIssuer: string
      JwtAudience: string
      JwtExpiryDays: int }

module Config =
    let load () =
        { MongoConnectionString =
            Environment.GetEnvironmentVariable "MONGODB_URI"
            |> Option.ofObj
            |> Option.defaultValue "mongodb://localhost:27017"
          DatabaseName = "hypertweet"
          JwtSecret =
            Environment.GetEnvironmentVariable "JWT_SECRET"
            |> Option.ofObj
            |> Option.defaultValue "super-secret-key-change-in-production"
          JwtIssuer = "HyperTweet"
          JwtAudience = "HyperTweet"
          JwtExpiryDays = 7 }
