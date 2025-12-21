namespace HypertweetServer.Features.Auth

open System
open HypertweetServer.Domain
open HypertweetServer.Shared

module Service =
    let register deps (cmd: RegisterCommand) =
        asyncResult {
            match! deps.FindUserByEmail cmd.Email with
            | Some _ -> return! AsyncResult.error (Conflict "Email already exists")
            | None ->
                let user: User =
                    { Id = User.newId ()
                      Email = cmd.Email
                      PasswordHash = PasswordHash(deps.HashPassword cmd.Password)
                      RefreshToken = None
                      RefreshTokenExpiry = None
                      DisabledToneIds = []
                      CreatedAt = DateTime.UtcNow }

                do! deps.InsertUser user
        }

    let private createTokenResult deps user =
        let accessToken = deps.GenerateAccessToken user
        let refreshToken = deps.GenerateRefreshToken()

        { AccessToken = accessToken
          RefreshToken = refreshToken
          ExpiresIn = deps.TokenExpirySeconds }

    let login deps (cmd: LoginCommand) =
        asyncResult {
            match! deps.FindUserByEmail cmd.Email with
            | Some({ PasswordHash = PasswordHash h } as user) when deps.VerifyPassword cmd.Password h ->
                let result = createTokenResult deps user
                let expiry = DateTime.UtcNow.AddDays 30.0
                do! deps.UpdateRefreshToken user.Id result.RefreshToken expiry
                return result
            | _ -> return! AsyncResult.error Unauthorized
        }

    let refresh deps (cmd: RefreshCommand) =
        asyncResult {
            let! userOpt = deps.FindByRefreshToken cmd.RefreshToken
            let! user = userOpt |> Option.requireSome Unauthorized |> async.Return
            let result = createTokenResult deps user
            let expiry = DateTime.UtcNow.AddDays 30.0
            do! deps.UpdateRefreshToken user.Id result.RefreshToken expiry
            return result
        }

