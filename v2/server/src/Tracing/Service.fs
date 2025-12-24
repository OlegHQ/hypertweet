module HypertweetServer.Tracing

open FsToolkit.ErrorHandling

open HypertweetServer
open HypertweetServer.Shared

let tracingCollection = "traces"

module TracingEvents =


    type User = { Id: string; Email: string }

    type Base =
        { Id: string
          Type: string
          User: User option }

    let makeUser (u: Domain.User) = { Id = u.Id; Email = u.Email }

    module ReplyEvent =
        type Tone = { ToneId: string; ToneName: string }

        type Input =
            { Prompt: string
              Model: string
              Page: Domain.Page
              Tone: Tone }

        type t =
            { Base: Base
              Input: Input
              CreatedAt: System.DateTime }

        let makeInput prompt model page tone =
            { Prompt = prompt
              Model = model
              Page = page
              Tone = tone }

        let makeEvt inBase input createdAt =
            { Base = inBase
              Input = input
              CreatedAt = createdAt }

        let makeTone (domainTone: Domain.Tone) =
            { ToneId = domainTone.Id
              ToneName = domainTone.Title }



let saveLLMReplyEvent db prompt tone model page user =
    taskResult {
        let createdUtc = System.DateTime.UtcNow

        let evt =
            TracingEvents.ReplyEvent.makeEvt
                { Id = Domain.newId ()
                  Type = "LLMReply"
                  User = Some(TracingEvents.makeUser user) }
                (TracingEvents.ReplyEvent.makeInput prompt model page (TracingEvents.ReplyEvent.makeTone tone))
                createdUtc

        let col = Db.collection<TracingEvents.ReplyEvent.t> db tracingCollection
        do! col |> Db.insertOne evt
        return evt
    }
