module HypertweetServer.Models

open System
open MongoDB.Bson.Serialization.Attributes

let newId () = Guid.NewGuid().ToString()

[<CLIMutable; BsonIgnoreExtraElements>]
type Profile =
    { Id: string
      ModelName: string
      UserBio: string option
      CustomReplyGuidance: string option
      PostProcessReply: bool option
      ReplyPromptOptions: string list
      ChatBotPersona: string option }

module ReplyPromptOption =
    type T =
        | NoEmojis
        | NoHashtags
        | NoPunctuation

    let tryParse (s: string) : T option =
        match s with
        | "NoEmojis" -> Some NoEmojis
        | "NoHashtags" -> Some NoHashtags
        | "NoPunctuation" -> Some NoPunctuation
        | _ -> None

    let toString (opt: T) : string =
        match opt with
        | NoEmojis -> "NoEmojis"
        | NoHashtags -> "NoHashtags"
        | NoPunctuation -> "NoPunctuation"

    let fromProfile profile =
        profile.ReplyPromptOptions
        |> List.map tryParse
        |> List.filter Option.isSome
        |> List.map Option.get


[<CLIMutable; BsonIgnoreExtraElements>]
type User =
    { [<BsonId>]
      Id: string
      Email: string
      PasswordHash: string
      DisabledToneIds: string list
      RefreshToken: string option
      RefreshTokenExpiry: DateTime option
      CreatedAt: DateTime }


[<CLIMutable>]
type Tone =
    { [<BsonId>]
      Id: string
      UserId: string option
      Title: string
      Instruction: string
      Enabled: bool option
      CreatedAt: DateTime }


type PageUser =
    { UserName: string option
      Email: string option
      Name: string option
      IsVerified: bool option
      Bio: string option
      Location: string option
      Website: string option
      JoinDate: string option
      Following: int option
      Followers: int option }

type Post =
    { Author: PageUser
      Text: string
      CurrentReplyDraft: string option
      Replies: Post list option
      Time: string option
      StatusID: string option
      Url: string option
      Upvotes: int option
      CommentCount: int option
      IsTopLevel: bool option }

type Page =
    { Site: string
      Url: string
      Posts: Post list
      ActivePost: Post option }

