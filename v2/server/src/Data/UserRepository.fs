namespace HypertweetServer.Data

open System
open MongoDB.Driver
open MongoDB.Bson
open HypertweetServer.Domain
open HypertweetServer.Shared

module UserRepository =
    let private tryDb f =
        async {
            try
                return! f () |> Async.map Ok
            with ex ->
                return Error(InternalError ex.Message)
        }

    let private collection (db: IMongoDatabase) = db.GetCollection<User> "users"

    let findByEmail (db: IMongoDatabase) (email: string) =
        tryDb (fun () ->
            async {
                let! r =
                    collection(db).Find(BsonDocument("Email", email)).FirstOrDefaultAsync()
                    |> Async.AwaitTask

                return r |> nullable
            })

    let findById (db: IMongoDatabase) (id: string) =
        tryDb (fun () ->
            async {
                let! r =
                    collection(db).Find(BsonDocument("_id", id)).FirstOrDefaultAsync()
                    |> Async.AwaitTask

                return r |> nullable
            })

    let insert (db: IMongoDatabase) user =
        tryDb (fun () -> async { do! collection(db).InsertOneAsync(user) |> Async.AwaitTask })

    let findByRefreshToken db token =
        tryDb (fun () ->
            async {
                let filter =
                    BsonDocument
                        [ BsonElement("RefreshToken", BsonValue.Create token)
                          BsonElement("RefreshTokenExpiry", BsonDocument("$gt", BsonValue.Create DateTime.UtcNow)) ]

                let! r = collection(db).Find(filter).FirstOrDefaultAsync() |> Async.AwaitTask
                return r |> nullable
            })

    let updateRefreshToken db (id: string) token expiry =
        tryDb (fun () ->
            async {
                let filter = BsonDocument("_id", id)

                let update =
                    BsonDocument(
                        "$set",
                        BsonDocument
                            [ BsonElement("RefreshToken", BsonValue.Create token)
                              BsonElement("RefreshTokenExpiry", BsonValue.Create expiry) ]
                    )

                do! collection(db).UpdateOneAsync(filter, update) |> Async.AwaitTask |> Async.Ignore
            })

    let update (db: IMongoDatabase) (user: User) =
        tryDb (fun () ->
            async {
                let filter = BsonDocument("_id", user.Id)
                do! collection(db).ReplaceOneAsync(filter, user) |> Async.AwaitTask |> Async.Ignore
            })
