namespace HypertweetServer.Domain

open System
open MongoDB.Bson.Serialization.Attributes

[<CLIMutable; BsonIgnoreExtraElements>]
type User =
    { [<BsonId>] Id: string
      Email: string
      PasswordHash: string
      DisabledToneIds: string list
      RefreshToken: string option
      RefreshTokenExpiry: DateTime option
      CreatedAt: DateTime }

module User =
    let newId () = Guid.NewGuid().ToString()
