module HypertweetServer.Tracing

open FsToolkit.ErrorHandling

open HypertweetServer
open HypertweetServer.Shared

let tracingCollection = "traces"

module TracingEvents =
    type User = { UserId: string; Email: string }

    [<CLIMutable>]
    type BaseEvent<'I, 'R> =
        { Id: string
          Type: string
          CreatedAt: System.DateTime
          User: User option
          Input: 'I
          Result: 'R }




    type Base = { Type: string; User: User option }

    let makeUser (u: Domain.User) = { UserId = u.Id; Email = u.Email }

    module ReplyEvent =
        type Tone = { ToneId: string; ToneName: string }

        type Input =
            { Prompt: string
              Model: string
              Page: Domain.Page
              Tone: Tone }


        type Result = { Reply: string; TimeTookMs: int }

        let makeInput prompt model page tone =
            { Prompt = prompt
              Model = model
              Page = page
              Tone = tone }

        let makeEvt id user input createdAt result =
            { Id = id
              Type = "ReplyEvent"
              User = user
              Input = input
              CreatedAt = createdAt
              Result = result }

        let makeTone (domainTone: Domain.Tone) =
            { ToneId = domainTone.Id
              ToneName = domainTone.Title }



let saveLLMReplyEvent db prompt tone model page user (result: TracingEvents.ReplyEvent.Result) =
    taskResult {
        let createdUtc = System.DateTime.UtcNow

        let evt =
            TracingEvents.ReplyEvent.makeEvt
                (Domain.newId ())
                (Some(TracingEvents.makeUser user))
                (TracingEvents.ReplyEvent.makeInput prompt model page (TracingEvents.ReplyEvent.makeTone tone))
                createdUtc
                result

        let col = Db.collection db tracingCollection
        do! col |> Db.insertOne evt
        return evt
    }

