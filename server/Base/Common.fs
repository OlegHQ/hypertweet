module Base.Common

open Giraffe
open Microsoft.AspNetCore.Http
open MongoDB.Driver
open MongoDB.Bson
open FsToolkit.ErrorHandling
open System.Security.Claims

type DomainError =
    | ValidationError of field: string * message: string
    | NotFound of entity: string
    | Conflict of message: string
    | Unauthorized
    | InternalError of message: string


module TracingUtils =
    open System.Diagnostics

    let measureTask f =
        task {
            let sw = Stopwatch.StartNew()
            let! result = f ()
            sw.Stop()
            return result, sw.Elapsed
        }

module HttpCtx =
    type QueryParam =
        | Empty
        | Value of string
        | Values of string list

    let logger name (ctx: HttpContext) = ctx.GetLogger name
    let bindJson<'T> (ctx: HttpContext) = ctx.BindJsonAsync<'T>()

    let queryParam name (ctx: HttpContext) =
        match ctx.Request.Query.TryGetValue name with
        | true, values when values.Count > 1 -> Values(values |> Seq.toList)
        | true, values when values.Count = 1 -> Value values.[0]
        | _ -> Empty

    let getUserId (ctx: HttpContext) =
        let claim = ctx.User.FindFirst ClaimTypes.NameIdentifier
        claim.Value

    let errHandle next ctx res =
        res
        |> Task.bind (function
            | Ok webResponse -> System.Threading.Tasks.Task.FromResult webResponse
            | Error err ->
                match err with
                | ValidationError(field, message) ->
                    RequestErrors.BAD_REQUEST {| Error = message; Field = field |} next ctx
                | NotFound entity -> RequestErrors.NOT_FOUND {| Error = $"{entity} not found" |} next ctx
                | Conflict message -> RequestErrors.CONFLICT {| Error = message |} next ctx
                | Unauthorized -> RequestErrors.UNAUTHORIZED "Bearer" "api" {| Error = "Unauthorized" |} next ctx
                | InternalError message ->
                    Log.error (sprintf "Internal error: %s" message) (Log.http ctx)
                    ServerErrors.INTERNAL_ERROR {| Error = "Internal server error" |} next ctx)

module Jwt =
    open System
    open System.Text
    open System.Security.Claims
    open System.IdentityModel.Tokens.Jwt
    open Microsoft.IdentityModel.Tokens
    open System.Security.Cryptography

    let generateRefreshToken () =
        Convert.ToBase64String(RandomNumberGenerator.GetBytes 64)

    let generateToken (jwtSecret: string) jwtIssuer jwtAudience jwtExpiryDays (id: string) (email: string) =
        let key = SymmetricSecurityKey(Encoding.UTF8.GetBytes jwtSecret)
        let creds = SigningCredentials(key, SecurityAlgorithms.HmacSha256)

        let claims =
            [| Claim(ClaimTypes.NameIdentifier, id); Claim(ClaimTypes.Email, email) |]

        let token =
            JwtSecurityToken(
                issuer = jwtIssuer,
                audience = jwtAudience,
                claims = claims,
                expires = DateTime.UtcNow.AddDays(float jwtExpiryDays),
                signingCredentials = creds
            )

        JwtSecurityTokenHandler().WriteToken token


module Db =
    let connect (mongoConnectionString: string) databaseName =
        Bson.registerSerializers ()
        let client = MongoClient mongoConnectionString
        client.GetDatabase databaseName

    let collection<'T> (db: IMongoDatabase) name = db.GetCollection<'T> name

    let tryDb f =
        async {
            try
                return! f () |> Async.map Ok
            with ex ->
                return Error(InternalError ex.Message)
        }

    let findOne<'T> (filter: BsonDocument) (col: IMongoCollection<'T>) =
        tryDb (fun () ->
            async {
                let! result = (col.Find filter).FirstOrDefaultAsync() |> Async.AwaitTask
                return result |> nullable
            })

    module ListParams =
        type t = { Limit: int option; Skip: int option }
        let make () = { Limit = None; Skip = None }
        let limit l p = { p with Limit = Some l }
        let skip s p = { p with Skip = Some s }

    let findMany<'T> (filter: BsonDocument) (opts: ListParams.t option) (col: IMongoCollection<'T>) =
        tryDb (fun () ->
            async {
                let mutable cursor = col.Find filter

                match opts with
                | Some p ->
                    p.Skip |> Option.iter (fun s -> cursor <- cursor.Skip s)
                    p.Limit |> Option.iter (fun l -> cursor <- cursor.Limit l)
                | None -> ()

                let! result = cursor.ToListAsync() |> Async.AwaitTask
                return result |> Seq.toList
            })

    let updateOne (filter: BsonDocument) (doc: BsonDocument) (col: IMongoCollection<'T>) =
        tryDb (fun () -> col.UpdateOneAsync(filter, doc) |> Async.AwaitTask)

    let deleteOne (filter: BsonDocument) (col: IMongoCollection<'T>) =
        tryDb (fun () -> col.DeleteOneAsync filter |> Async.AwaitTask)

    let upsertOne (filter: BsonDocument) (doc: BsonDocument) (col: IMongoCollection<'T>) =
        tryDb (fun () ->
            col.UpdateOneAsync(filter, doc, UpdateOptions(IsUpsert = true))
            |> Async.AwaitTask)

    let insertOne<'T> (doc: 'T) (col: IMongoCollection<'T>) =
        tryDb (fun () -> col.InsertOneAsync doc |> Async.AwaitTask)

module Validate =
    open System

    let notEmpty field value =
        if String.IsNullOrWhiteSpace value then
            Error(ValidationError(field, "cannot be empty"))
        else
            Ok value

    let minLength field len (value: string) =
        if value.Length < len then
            Error(ValidationError(field, $"must be at least {len} characters"))
        else
            Ok value

    let matches field pattern (value: string) =
        if System.Text.RegularExpressions.Regex.IsMatch(value, pattern) then
            Ok value
        else
            Error(ValidationError(field, "invalid format"))

    let email field value =
        value
        |> notEmpty field
        |> Result.bind (matches field @"^[^@\s]+@[^@\s]+\.[^@\s]+$")

    let chain validators value =
        validators |> List.fold (fun acc v -> Result.bind v acc) (Ok value)
