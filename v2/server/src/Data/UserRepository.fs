namespace HypertweetServer.Data

open System
open MongoDB.Driver
open MongoDB.Bson
open MongoDB.Bson.Serialization.Attributes
open HypertweetServer.Domain
open HypertweetServer.Shared

[<CLIMutable>]
[<BsonIgnoreExtraElements>]
type UserDocument =
    { [<BsonId>]
      Id: string
      Email: string
      DisabledToneIds: ResizeArray<string>
      PasswordHash: string
      [<BsonIgnoreIfNull>]
      RefreshToken: string
      RefreshTokenExpiry: Nullable<DateTime>
      CreatedAt: DateTime }

module UserRepository =
    let private tryDb f =
        async {
            try
                return! f () |> Async.map Ok
            with ex ->
                return Error(InternalError ex.Message)
        }

    let private collection (db: IMongoDatabase) = db.GetCollection<UserDocument> "users"

    let private toDoc (user: User) =
        let (UserId id) = user.Id
        let (Email e) = user.Email
        let (PasswordHash h) = user.PasswordHash

        { Id = id
          Email = e
          DisabledToneIds = ResizeArray(user.DisabledToneIds)
          PasswordHash = h
          RefreshToken = user.RefreshToken |> Option.toObj
          RefreshTokenExpiry = user.RefreshTokenExpiry |> Option.toNullable
          CreatedAt = user.CreatedAt }

    let private toDomain (doc: UserDocument) : User =
        { Id = UserId doc.Id
          Email = Email doc.Email
          DisabledToneIds = doc.DisabledToneIds |> Seq.toList
          RefreshToken = doc.RefreshToken |> Option.ofObj
          RefreshTokenExpiry = doc.RefreshTokenExpiry |> Option.ofNullable
          PasswordHash = PasswordHash doc.PasswordHash
          CreatedAt = doc.CreatedAt }

    let findByEmail (db: IMongoDatabase) (Email email) =
        tryDb (fun () ->
            async {
                let! r =
                    collection(db).Find(BsonDocument("Email", email)).FirstOrDefaultAsync()
                    |> Async.AwaitTask

                return r |> nullable |> Option.map toDomain
            })

    let findById (db: IMongoDatabase) (UserId id) =
        tryDb (fun () ->
            async {
                let! r =
                    collection(db).Find(BsonDocument("_id", id)).FirstOrDefaultAsync()
                    |> Async.AwaitTask

                return r |> nullable |> Option.map toDomain
            })

    let insert (db: IMongoDatabase) user =
        tryDb (fun () -> async { do! collection(db).InsertOneAsync(toDoc user) |> Async.AwaitTask })

    let findByRefreshToken db token =
        tryDb (fun () ->
            async {
                let filter =
                    BsonDocument
                        [ BsonElement("RefreshToken", BsonValue.Create token)
                          BsonElement("RefreshTokenExpiry", BsonDocument("$gt", BsonValue.Create DateTime.UtcNow)) ]

                let! r = collection(db).Find(filter).FirstOrDefaultAsync() |> Async.AwaitTask
                return r |> nullable |> Option.map toDomain
            })

    let updateRefreshToken db (UserId id) token expiry =
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
        let (UserId id) = user.Id

        tryDb (fun () ->
            async {
                let filter = BsonDocument("_id", id)

                do!
                    collection(db).ReplaceOneAsync(filter, toDoc user)
                    |> Async.AwaitTask
                    |> Async.Ignore
            })

