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
                let defaults = Helpers.getDefaultTones ()

                let enabledDefaults =
                    defaults
                    |> List.filter (fun tone -> not (List.contains tone.Id user.DisabledToneIds))

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
            let id = tone.Id
            return id
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

                    do! deps.UpdateUser { user with DisabledToneIds = newDisabled }
        }
