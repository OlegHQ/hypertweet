namespace HypertweetServer.Features.Tones

open System
open HypertweetServer
open HypertweetServer.Domain
open HypertweetServer.Shared

module Service =
    open FsToolkit.ErrorHandling

    let makeResolvedTones user userTones =
        let defaults = Helpers.getDefaultTones ()

        let defaultsWithEnabled =
            defaults
            |> List.map (fun tone ->
                { tone with
                    Enabled = Some(not (List.contains tone.Id user.DisabledToneIds)) })

        userTones @ defaultsWithEnabled


    let resolveTones db userId =
        taskResult {
            let! user = Db.collection db "users" |> Db.findOne (Bson.make () |> Bson.field "_id" userId)
            let! user = user |> Result.requireSome (NotFound "User")

            let! userTones = DataAccess.userTones db userId

            return makeResolvedTones user userTones
        }

    let list deps userId =
        asyncResult {
            match! deps.GetUser userId with
            | None -> return! AsyncResult.error (NotFound "User")
            | Some user ->
                let! userTones = deps.FindTonesByUser userId
                return makeResolvedTones user userTones
        }

    let create deps userId (cmd: CreateToneCommand) =
        asyncResult {
            let tone: Tone =
                { Id = newId ()
                  UserId = Some userId
                  Title = cmd.Title
                  Instruction = cmd.Instruction
                  Enabled = None
                  CreatedAt = DateTime.UtcNow }

            do! deps.InsertTone tone
            return tone.Id
        }

    let update deps userId (cmd: UpdateToneCommand) =
        asyncResult {
            match! deps.FindToneById cmd.ToneId with
            | None -> return! AsyncResult.error (NotFound "Tone")
            | Some tone when tone.UserId <> Some userId -> return! AsyncResult.error Unauthorized
            | Some tone ->
                let updated =
                    { tone with
                        Title = cmd.Title
                        Instruction = cmd.Instruction }

                do! deps.UpdateTone updated
        }

    let delete deps userId toneId =
        asyncResult {
            // Check hardcoded defaults first
            match Helpers.findDefaultById toneId with
            | Some _ -> return! AsyncResult.error (ValidationError("toneId", "Cannot delete default tone"))
            | None ->
                match! deps.FindToneById toneId with
                | None -> return! AsyncResult.error (NotFound "Tone")
                | Some tone when tone.UserId <> Some userId -> return! AsyncResult.error Unauthorized
                | Some _ -> do! deps.DeleteTone toneId
        }

    let toggleDefault deps userId toneId enabled =
        asyncResult {
            // Check hardcoded defaults - only default tones can be toggled
            match Helpers.findDefaultById toneId with
            | None -> return! AsyncResult.error (ValidationError("toneId", "Not a default tone"))
            | Some _ ->
                match! deps.GetUser userId with
                | None -> return! AsyncResult.error (NotFound "User")
                | Some user ->

                    let newDisabled =
                        if enabled then
                            user.DisabledToneIds |> List.filter ((<>) toneId)
                        elif List.contains toneId user.DisabledToneIds then
                            user.DisabledToneIds
                        else
                            toneId :: user.DisabledToneIds

                    do!
                        deps.UpdateUser
                            { user with
                                DisabledToneIds = newDisabled }
        }
