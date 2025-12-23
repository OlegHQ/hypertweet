namespace HypertweetServer.Domain

open System


type Tone =
    { Id: string
      UserId: string option
      Title: string
      Instruction: string
      CreatedAt: DateTime }

module Tone =
    let newId () = Guid.NewGuid().ToString()
