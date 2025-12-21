namespace HypertweetServer.Features.Auth

open HypertweetServer.Domain
open HypertweetServer.Shared

// DTOs for HTTP requests
[<CLIMutable>]
type RegisterRequest = { Email: string; Password: string }

[<CLIMutable>]
type LoginRequest = { Email: string; Password: string }

// Commands (validated input)
type RegisterCommand = { Email: Email; Password: string }

type LoginCommand = { Email: Email; Password: string }

type RefreshCommand = { RefreshToken: string }

type TokenResult =
    { AccessToken: string
      RefreshToken: string
      ExpiresIn: int }

// Dependencies record
type AuthDeps =
    { FindUserByEmail: Email -> AsyncResult<User option, DomainError>
      InsertUser: User -> AsyncResult<unit, DomainError>
      FindByRefreshToken: string -> AsyncResult<User option, DomainError>
      UpdateRefreshToken: UserId -> string -> System.DateTime -> AsyncResult<unit, DomainError>
      HashPassword: string -> string
      VerifyPassword: string -> string -> bool
      GenerateAccessToken: User -> string
      GenerateRefreshToken: unit -> string
      TokenExpirySeconds: int }

[<CLIMutable>]
type RefreshRequest = { RefreshToken: string }

