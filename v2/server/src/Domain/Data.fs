namespace HypertweetServer.Domain

open HypertweetServer.Shared
type Profile = { Id: string; ModelName: string }

module DataAccess =
    let userCol db = Db.collection<User> db "users"
    let profileCol db = Db.collection<Profile> db "users"

    let userByKey db key value =
        userCol db |> Db.findOne (Bson.make () |> Bson.field key value)

    let user db id = userByKey db "_id" id

    let profile db userId =
        profileCol db |> Db.findOne (Bson.make () |> Bson.field "_id" userId)

    let userTones db userId =
        Db.collection db "tones"
        |> Db.findMany (Bson.make () |> Bson.field "UserId" userId) None

