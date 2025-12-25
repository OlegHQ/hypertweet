namespace HypertweetServer.Infrastructure

open System
open System.Text
open System.Security.Claims
open System.IdentityModel.Tokens.Jwt
open Microsoft.IdentityModel.Tokens
open HypertweetServer.Shared
open HypertweetServer.Domain

module Jwt =
    open System.Security.Cryptography

    let generateRefreshToken () =
        Convert.ToBase64String(RandomNumberGenerator.GetBytes 64)

    let generateToken config (user: User) =
        let key = SymmetricSecurityKey(Encoding.UTF8.GetBytes config.JwtSecret)
        let creds = SigningCredentials(key, SecurityAlgorithms.HmacSha256)

        let claims =
            [| Claim(ClaimTypes.NameIdentifier, user.Id)
               Claim(ClaimTypes.Email, user.Email) |]

        let token =
            JwtSecurityToken(
                issuer = config.JwtIssuer,
                audience = config.JwtAudience,
                claims = claims,
                expires = DateTime.UtcNow.AddDays(float config.JwtExpiryDays),
                signingCredentials = creds
            )

        JwtSecurityTokenHandler().WriteToken token
