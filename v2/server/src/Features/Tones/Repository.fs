namespace HypertweetServer.Features.Tones

open System
open MongoDB.Driver
open MongoDB.Bson
open MongoDB.Bson.Serialization.Attributes
open HypertweetServer.Domain
open HypertweetServer.Shared

[<CLIMutable>]
type ToneDocument =
    { [<BsonId>]
      Id: string
      UserId: string // null for defaults
      Title: string
      Instruction: string
      CreatedAt: DateTime }

module Repository =
    let private tryDb f =
        async {
            try
                return! f () |> Async.map Ok
            with ex ->
                return Error(InternalError ex.Message)
        }

    let private collection (db: IMongoDatabase) = db.GetCollection<ToneDocument> "tones"

    let private toDoc (tone: Tone) =
        let userIdStr =
            match tone.UserId with
            | Some x -> x
            | _ -> ""

        { Id = tone.Id
          UserId = userIdStr
          Title = tone.Title
          Instruction = tone.Instruction
          CreatedAt = tone.CreatedAt }

    let private toDomain (doc: ToneDocument) : Tone =
        { Id = doc.Id
          UserId = if isNull doc.UserId then None else Some doc.UserId
          Title = doc.Title
          Instruction = doc.Instruction
          CreatedAt = doc.CreatedAt }

    let findById (db: IMongoDatabase) (id: string) =
        tryDb (fun () ->
            async {
                let! r =
                    collection(db).Find(BsonDocument("_id", id)).FirstOrDefaultAsync()
                    |> Async.AwaitTask

                return r |> nullable |> Option.map toDomain
            })

    let findByUser (db: IMongoDatabase) (userId: string) =
        tryDb (fun () ->
            async {
                let! r =
                    collection(db).Find(BsonDocument("UserId", userId)).ToListAsync()
                    |> Async.AwaitTask

                return r |> Seq.toList |> List.map toDomain
            })

    let insert (db: IMongoDatabase) tone =
        tryDb (fun () -> async { do! collection(db).InsertOneAsync(toDoc tone) |> Async.AwaitTask })

    let update (db: IMongoDatabase) (tone: Tone) =

        tryDb (fun () ->
            async {
                let filter = BsonDocument("_id", tone.Id)

                do!
                    collection(db).ReplaceOneAsync(filter, toDoc tone)
                    |> Async.AwaitTask
                    |> Async.Ignore
            })

    let delete (db: IMongoDatabase) (id: string) =
        tryDb (fun () ->
            async {
                let filter = BsonDocument("_id", id)
                do! collection(db).DeleteOneAsync filter |> Async.AwaitTask |> Async.Ignore
            })
