namespace HypertweetServer.Features.Tones

open System
open HypertweetServer.Domain
open HypertweetServer.Shared

module Service =
    let list deps userId =
        asyncResult {
            match! deps.GetUser userId with
            | None -> return! AsyncResult.error (NotFound "User")
            | Some user ->
                let! userTones = deps.FindTonesByUser userId
                let! defaults = deps.FindDefaultTones ()

                let enabledDefaults =
                    defaults
                    |> List.filter (fun tone ->
                        let (ToneId id) = tone.Id
                        not (List.contains id user.DisabledToneIds))

                return userTones @ enabledDefaults
        }

    let create deps userId (cmd: CreateToneCommand) =
        asyncResult {
            let tone: Tone =
                { Id = Tone.newId ()
                  UserId = Some userId
                  Title = cmd.Title
                  Instruction = cmd.Instruction
                  CreatedAt = DateTime.UtcNow }

            do! deps.InsertTone tone
            let (ToneId id) = tone.Id
            return id
        }

    let update deps userId (cmd: UpdateToneCommand) =
        asyncResult {
            match! deps.FindToneById cmd.ToneId with
            | None -> return! AsyncResult.error (NotFound "Tone")
            | Some tone when tone.UserId <> Some userId ->
                return! AsyncResult.error Unauthorized
            | Some tone ->
                let updated = { tone with Title = cmd.Title; Instruction = cmd.Instruction }
                do! deps.UpdateTone updated
        }

    let delete deps userId toneId =
        asyncResult {
            match! deps.FindToneById toneId with
            | None -> return! AsyncResult.error (NotFound "Tone")
            | Some tone when tone.UserId <> Some userId ->
                return! AsyncResult.error Unauthorized
            | Some tone when tone.UserId.IsNone ->
                return! AsyncResult.error (ValidationError("toneId", "Cannot delete default tone"))
            | Some _ -> do! deps.DeleteTone toneId
        }

    let toggleDefault deps userId toneId enabled =
        asyncResult {
            match! deps.FindToneById toneId with
            | None -> return! AsyncResult.error (NotFound "Tone")
            | Some tone when tone.UserId.IsSome ->
                return! AsyncResult.error (ValidationError("toneId", "Not a default tone"))
            | Some _ ->
                match! deps.GetUser userId with
                | None -> return! AsyncResult.error (NotFound "User")
                | Some user ->
                    let (ToneId id) = toneId
                    let newDisabled =
                        if enabled then
                            user.DisabledToneIds |> List.filter ((<>) id)
                        else if List.contains id user.DisabledToneIds then
                            user.DisabledToneIds
                        else
                            id :: user.DisabledToneIds

                    do! deps.UpdateUser { user with DisabledToneIds = newDisabled }
        }
