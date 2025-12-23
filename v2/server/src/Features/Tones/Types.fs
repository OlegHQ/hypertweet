namespace HypertweetServer.Features.Tones

open HypertweetServer.Domain
open HypertweetServer.Shared

// DTOs for HTTP requests
[<CLIMutable>]
type CreateToneRequest = { Title: string; Instruction: string }

[<CLIMutable>]
type UpdateToneRequest = { Title: string; Instruction: string }

// Commands (validated input)
type CreateToneCommand = { Title: string; Instruction: string }

type UpdateToneCommand =
    { ToneId: string
      Title: string
      Instruction: string }

// Response DTO
type ToneResponse =
    { Id: string
      Title: string
      Instruction: string
      IsDefault: bool }

module ToneResponse =
    let fromDomain (tone: Tone) =
        let id = tone.Id

        { Id = id
          Title = tone.Title
          Instruction = tone.Instruction
          IsDefault = tone.UserId.IsNone }

// Dependencies record
type ToneDeps =
    { GetUser: string -> AsyncResult<User option, DomainError>
      UpdateUser: User -> AsyncResult<unit, DomainError>
      FindToneById: string -> AsyncResult<Tone option, DomainError>
      FindTonesByUser: string -> AsyncResult<Tone list, DomainError>
      InsertTone: Tone -> AsyncResult<unit, DomainError>
      UpdateTone: Tone -> AsyncResult<unit, DomainError>
      DeleteTone: string -> AsyncResult<unit, DomainError> }
