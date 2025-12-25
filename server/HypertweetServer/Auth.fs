module HypertweetServer.Auth

open Giraffe
open Base
open Base.Common
open HypertweetServer
open HypertweetServer.Models
open HypertweetServer.Config
open FsToolkit.ErrorHandling

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

let private validateRegister (req: RegisterRequest) =
    result {
        let! email = req.Email |> Validate.email "email"

        let! password =
            req.Password
            |> Validate.chain [ Validate.notEmpty "password"; Validate.minLength "password" 8 ]

        return
            { RegisterCommand.Email = email
              Password = password }
    }


let private validateLogin (req: LoginRequest) =
    result {
        let! email = req.Email |> Validate.email "email"
        let! password = req.Password |> Validate.notEmpty "password"

        return { Email = email; Password = password }
    }

let private validateRefresh (req: RefreshRequest) =
    result {
        let! refreshToken = req.RefreshToken |> Validate.notEmpty "refreshToken"
        return { RefreshCommand.RefreshToken = refreshToken }
    }


let userByKey = DataAccess.userByKey
let userCol = DataAccess.userCol
let userByEmail db = userByKey db "Email"
let userByRefreshToken db = userByKey db "RefreshToken"

let createTokenResult config (user: User) =
    let accessToken =
        Jwt.generateToken config.JwtSecret config.JwtIssuer config.JwtAudience config.JwtExpiryDays user.Id user.Email

    let refreshToken = Jwt.generateRefreshToken ()
    let expiresIn = config.JwtExpiryDays * 24 * 60 * 60

    { AccessToken = accessToken
      RefreshToken = refreshToken
      ExpiresIn = expiresIn }


let updateRefreshToken userId refreshToken expiry db =
    userCol db
    |> Db.updateOne
        (Bson.make () |> Bson.field "_id" userId)
        (Bson.make ()
         |> Bson.field
             "$set"
             (Bson.make ()
              |> Bson.field "RefreshToken" refreshToken
              |> Bson.field "RefreshTokenExpiry" expiry))
    |> AsyncResult.map ignore

let login config db next ctx =
    taskResult {
        let! req = HttpCtx.bindJson<LoginRequest> ctx |> Task.map validateLogin

        let! user =
            userByEmail db req.Email
            |> Async.map (Result.bind (Result.requireSome (NotFound "User")))

        let result = createTokenResult config user

        let expiry = System.DateTime.UtcNow.AddDays 30.0
        do! updateRefreshToken user.Id result.RefreshToken expiry db

        return! json result next ctx
    }
    |> HttpCtx.errHandle next ctx

let register db next ctx =
    taskResult {
        let! req = HttpCtx.bindJson<RegisterRequest> ctx |> Task.map validateRegister
        let col = userCol db
        let! user = userByEmail db req.Email
        do! user |> Result.requireNone (Conflict "User already exists")

        let user =
            { Id = newId ()
              Email = req.Email
              PasswordHash = BCrypt.Net.BCrypt.HashPassword req.Password
              RefreshToken = None
              RefreshTokenExpiry = None
              DisabledToneIds = []
              CreatedAt = System.DateTime.UtcNow }

        do! Db.insertOne user col
        let u = { user with PasswordHash = "" }
        return! json u next ctx
    }
    |> HttpCtx.errHandle next ctx


let refresh config db next ctx =
    taskResult {
        let! req = HttpCtx.bindJson<RefreshRequest> ctx |> Task.map validateRefresh

        let! user = userByRefreshToken db req.RefreshToken
        let! user = user |> Result.requireSome (NotFound "User")
        let result = createTokenResult config user

        let expiry = System.DateTime.UtcNow.AddDays 30.0
        do! updateRefreshToken user.Id result.RefreshToken expiry db

        return! json {| token = result.AccessToken |} next ctx
    }
    |> HttpCtx.errHandle next ctx
