namespace HypertweetServer.Features.Tones

open System
open Giraffe
open MongoDB.Driver
open HypertweetServer
open HypertweetServer.Domain
open HypertweetServer.Shared
open FsToolkit.ErrorHandling

// DTOs
[<CLIMutable>]
type CreateToneRequest = { Title: string; Instruction: string }

[<CLIMutable>]
type UpdateToneRequest = { Title: string; Instruction: string }

type ToneResponse =
    { Id: string
      Title: string
      Instruction: string
      IsDefault: bool
      Enabled: bool option }

module Handlers =
    // Collection helper
    let toneCol db = Db.collection<Tone> db "tones"

    // Default tones
    let private defaultTones: Tone list =
        [ { Id = "default-professional"
            UserId = None
            Title = "Professional"
            Instruction = "Write in a professional, business-appropriate tone. Be clear, concise, and respectful."
            Enabled = None
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
          { Id = "default-friendly"
            UserId = None
            Title = "Friendly"
            Instruction = "Write in a warm, approachable, and conversational tone. Be personable and engaging."
            Enabled = None
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
          { Id = "default-witty"
            UserId = None
            Title = "Witty"
            Instruction = "Write with clever humor and sharp observations. Be playful but not offensive."
            Enabled = None
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
          { Id = "default-insightful"
            UserId = None
            Title = "Insightful"
            Instruction = "Provide thoughtful, analytical perspectives. Add value through unique observations and deeper understanding."
            Enabled = None
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
          { Id = "default-casual"
            UserId = None
            Title = "Casual"
            Instruction = "Write in a relaxed, informal style. Use everyday language and be relatable."
            Enabled = None
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) } ]

    let private findDefaultById id =
        defaultTones |> List.tryFind (fun t -> t.Id = id)

    // Response conversion
    let private toResponse (tone: Tone) =
        { Id = tone.Id
          Title = tone.Title
          Instruction = tone.Instruction
          IsDefault = tone.UserId.IsNone
          Enabled = tone.Enabled }

    // Merge user tones with defaults (public for AI Service)
    let makeResolvedTones (user: User) (userTones: Tone list) =
        let defaultsWithEnabled =
            defaultTones
            |> List.map (fun tone ->
                { tone with Enabled = Some(not (List.contains tone.Id user.DisabledToneIds)) })
        userTones @ defaultsWithEnabled

    // Validation
    let private validateCreate (req: CreateToneRequest) =
        result {
            let! title = req.Title |> Validate.notEmpty "title"
            let! instruction = req.Instruction |> Validate.notEmpty "instruction"
            return (title, instruction)
        }

    let private validateUpdate (req: UpdateToneRequest) =
        result {
            let! title = req.Title |> Validate.notEmpty "title"
            let! instruction = req.Instruction |> Validate.notEmpty "instruction"
            return (title, instruction)
        }

    // Handlers
    let list (db: IMongoDatabase) next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx

            let! user =
                DataAccess.user db userId
                |> Async.map (Result.bind (Result.requireSome (NotFound "User")))

            let! userTones =
                toneCol db
                |> Db.findMany (Bson.make () |> Bson.field "UserId" userId) None

            let resolved = makeResolvedTones user userTones
            return! json (resolved |> List.map toResponse) next ctx
        }
        |> HttpCtx.errHandle next ctx

    let create (db: IMongoDatabase) next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx
            let! req = HttpCtx.bindJson<CreateToneRequest> ctx |> Task.map validateCreate

            let tone: Tone =
                { Id = newId ()
                  UserId = Some userId
                  Title = req |> fst
                  Instruction = req |> snd
                  Enabled = None
                  CreatedAt = DateTime.UtcNow }

            do! toneCol db |> Db.insertOne tone
            return! Successful.created (json {| id = tone.Id |}) next ctx
        }
        |> HttpCtx.errHandle next ctx

    let update (db: IMongoDatabase) (toneId: string) next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx
            let! req = HttpCtx.bindJson<UpdateToneRequest> ctx |> Task.map validateUpdate

            let! tone =
                toneCol db
                |> Db.findOne (Bson.make () |> Bson.field "_id" toneId)
                |> Async.map (Result.bind (Result.requireSome (NotFound "Tone")))

            do!
                if tone.UserId <> Some userId then
                    Error Unauthorized
                else
                    Ok ()

            let updated =
                { tone with
                    Title = req |> fst
                    Instruction = req |> snd }

            do!
                toneCol db
                |> Db.updateOne
                    (Bson.make () |> Bson.field "_id" toneId)
                    (Bson.make ()
                     |> Bson.field "$set" (Bson.make () |> Bson.field "Title" updated.Title |> Bson.field "Instruction" updated.Instruction))
                |> AsyncResult.map ignore

            return! Successful.ok (json {| message = "Updated" |}) next ctx
        }
        |> HttpCtx.errHandle next ctx

    let delete (db: IMongoDatabase) (toneId: string) next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx

            // Prevent deleting defaults
            do!
                match findDefaultById toneId with
                | Some _ -> Error(ValidationError("toneId", "Cannot delete default tone"))
                | None -> Ok ()

            let! tone =
                toneCol db
                |> Db.findOne (Bson.make () |> Bson.field "_id" toneId)
                |> Async.map (Result.bind (Result.requireSome (NotFound "Tone")))

            do!
                if tone.UserId <> Some userId then
                    Error Unauthorized
                else
                    Ok ()

            do!
                toneCol db
                |> Db.deleteOne (Bson.make () |> Bson.field "_id" toneId)
                |> AsyncResult.map ignore

            return! Successful.ok (json {| message = "Deleted" |}) next ctx
        }
        |> HttpCtx.errHandle next ctx

    let toggleDefault (db: IMongoDatabase) (toneId: string) next ctx =
        taskResult {
            let userId = HttpCtx.getUserId ctx

            let enabled =
                match HttpCtx.queryParam "enable" ctx with
                | HttpCtx.Value "true" -> true
                | HttpCtx.Value "false" -> false
                | _ -> true

            // Only default tones can be toggled
            do!
                match findDefaultById toneId with
                | None -> Error(ValidationError("toneId", "Not a default tone"))
                | Some _ -> Ok ()

            let! user =
                DataAccess.user db userId
                |> Async.map (Result.bind (Result.requireSome (NotFound "User")))

            let newDisabled =
                if enabled then
                    user.DisabledToneIds |> List.filter ((<>) toneId)
                elif List.contains toneId user.DisabledToneIds then
                    user.DisabledToneIds
                else
                    toneId :: user.DisabledToneIds

            do!
                DataAccess.userCol db
                |> Db.updateOne
                    (Bson.make () |> Bson.field "_id" userId)
                    (Bson.make () |> Bson.field "$set" (Bson.make () |> Bson.field "DisabledToneIds" newDisabled))
                |> AsyncResult.map ignore

            return! Successful.ok (json {| message = if enabled then "Enabled" else "Disabled" |}) next ctx
        }
        |> HttpCtx.errHandle next ctx
