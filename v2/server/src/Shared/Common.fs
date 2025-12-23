namespace HypertweetServer.Shared

open Giraffe
open Microsoft.AspNetCore.Http
open MongoDB.Driver
open MongoDB.Bson
open FsToolkit.ErrorHandling
open System.Security.Claims

module HttpCtx =
    let logger name (ctx: HttpContext) = ctx.GetLogger name
    let bindJson<'T> (ctx: HttpContext) = ctx.BindJsonAsync<'T>()

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

module Db =
    let connect (config: AppConfig) =
        Bson.registerSerializers ()
        let client = MongoClient config.MongoConnectionString
        client.GetDatabase config.DatabaseName

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

