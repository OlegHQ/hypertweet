namespace HypertweetServer.Features.Auth

open HypertweetServer.Domain
open HypertweetServer.Shared

// DTOs for HTTP requests
[<CLIMutable>]
type RegisterRequest = { Email: string; Password: string }

[<CLIMutable>]
type LoginRequest = { Email: string; Password: string }

// Commands (validated input)
type RegisterCommand = { Email: string; Password: string }

type LoginCommand = { Email: string; Password: string }

type RefreshCommand = { RefreshToken: string }

type TokenResult =
    { AccessToken: string
      RefreshToken: string
      ExpiresIn: int }

[<CLIMutable>]
type RefreshRequest = { RefreshToken: string }
