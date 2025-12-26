module HypertweetServer.Tracing

open FsToolkit.ErrorHandling
open MongoDB.Bson

open HypertweetServer

let tracingCollection = "traces"
let newObjectId () = ObjectId.GenerateNewId()

let ttlDays = 14

module TracingEvents =
    type User = { UserId: string; Email: string }

    [<CLIMutable>]
    type BaseEvent<'I, 'R> =
        { Id: ObjectId
          Type: string
          CreatedAt: System.DateTime
          DeleteAt: System.DateTime
          User: User option
          Input: 'I
          Result: 'R }




    type Base = { Type: string; User: User option }

    let makeUser (u: Models.User) = { UserId = u.Id; Email = u.Email }

    module ReplyEvent =
        type Tone = { ToneId: string; ToneName: string }

        type Input =
            { Prompt: string
              Model: string
              Page: Models.Page
              Tone: Tone }


        type Result = { Reply: string; TimeTookMs: int }

        let makeInput prompt model page tone =
            { Prompt = prompt
              Model = model
              Page = page
              Tone = tone }

        let makeEvt id user input createdAt deleteAt result =
            { Id = id
              Type = "ReplyEvent"
              User = user
              Input = input
              CreatedAt = createdAt
              DeleteAt = deleteAt
              Result = result }

        let makeTone (domainTone: Models.Tone) =
            { ToneId = domainTone.Id
              ToneName = domainTone.Title }



let saveLLMReplyEvent db prompt tone model page user (result: TracingEvents.ReplyEvent.Result) =
    taskResult {
        let createdUtc = System.DateTime.UtcNow
        let deleteAt = createdUtc.AddDays(float ttlDays)

        let evt =
            TracingEvents.ReplyEvent.makeEvt
                (newObjectId ())
                (Some(TracingEvents.makeUser user))
                (TracingEvents.ReplyEvent.makeInput prompt model page (TracingEvents.ReplyEvent.makeTone tone))
                createdUtc
                deleteAt
                result

        let col = Base.Common.Db.collection db tracingCollection
        do! col |> Base.Common.Db.insertOne evt
        return evt
    }
