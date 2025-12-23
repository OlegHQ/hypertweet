namespace HypertweetServer.AI

open FsToolkit.ErrorHandling

module Service =
    open HypertweetServer.Features.Tones

    let generateCompletion deps toneId userId =
        taskResult {
            let! dps = Service.list deps userId
            let tone = dps |> List.tryFind (fun x -> x.Id = toneId)

            ()
        }
