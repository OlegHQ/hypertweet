module HypertweetServer.DataAccess

open Base
open Base.Common
open HypertweetServer.Models

let userCol db = Db.collection<User> db "users"
let profileCol db = Db.collection<Profile> db "profiles"
let keyFilter key value = Bson.make () |> Bson.field key value

let idFilter value = keyFilter "_id" value

let userByKey db key value =
    userCol db |> Db.findOne (keyFilter key value)

let user db id = userByKey db "_id" id

let profile db userId =
    profileCol db |> Db.findOne (Bson.make () |> Bson.field "_id" userId)

let userTones db userId =
    Log.make () |> Log.info "attempting to get tones..."

    Db.collection<Tone> db "tones"
    |> Db.findMany (Bson.make () |> Bson.field "UserId" userId) None
