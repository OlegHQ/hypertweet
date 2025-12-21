namespace HypertweetServer.Domain

open System

type UserId = UserId of string
type Email = Email of string
type PasswordHash = PasswordHash of string

type User =
    { Id: UserId
      Email: Email
      PasswordHash: PasswordHash
      DisabledToneIds: string list
      RefreshToken: string option
      RefreshTokenExpiry: DateTime option
      CreatedAt: DateTime }

module User =
    let newId () = UserId(Guid.NewGuid().ToString())

