namespace HypertweetServer.Features.Tones

open System
open HypertweetServer.Domain

module Helpers =
    let private defaultTones: Tone list =
        [ { Id = ToneId "default-professional"
            UserId = None
            Title = "Professional"
            Instruction = "Write in a professional, business-appropriate tone. Be clear, concise, and respectful."
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
          { Id = ToneId "default-friendly"
            UserId = None
            Title = "Friendly"
            Instruction = "Write in a warm, approachable, and conversational tone. Be personable and engaging."
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
          { Id = ToneId "default-witty"
            UserId = None
            Title = "Witty"
            Instruction = "Write with clever humor and sharp observations. Be playful but not offensive."
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
          { Id = ToneId "default-insightful"
            UserId = None
            Title = "Insightful"
            Instruction = "Provide thoughtful, analytical perspectives. Add value through unique observations and deeper understanding."
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
          { Id = ToneId "default-casual"
            UserId = None
            Title = "Casual"
            Instruction = "Write in a relaxed, informal style. Use everyday language and be relatable."
            CreatedAt = DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) } ]

    let getDefaultTones () = defaultTones

    let findDefaultById (ToneId id) =
        defaultTones |> List.tryFind (fun t -> let (ToneId tid) = t.Id in tid = id)

