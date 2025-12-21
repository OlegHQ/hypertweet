namespace HypertweetServer.Domain

open System
type ToneId = ToneId of string


type Tone =
    { Id: ToneId
      UserId: UserId option // None = default/predefined tone
      Title: string
      Instruction: string
      CreatedAt: DateTime }

module Tone =
    let newId () = ToneId(Guid.NewGuid().ToString())

