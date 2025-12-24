
namespace HypertweetServer

open System
open MongoDB.Bson.Serialization.Attributes

module Domain =
    let newId () = Guid.NewGuid().ToString()

    type Profile = { Id: string; ModelName: string }

    [<CLIMutable; BsonIgnoreExtraElements>]
    type User =
        {   [<BsonId>] Id: string
            Email: string
            PasswordHash: string
            DisabledToneIds: string list
            RefreshToken: string option
            RefreshTokenExpiry: DateTime option
            CreatedAt: DateTime }


    type Tone =
        {   Id: string
            UserId: string option
            Title: string
            Instruction: string
            Enabled: bool option
            CreatedAt: DateTime }


    type PageUser =
        {   UserName: string option
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
        {   Author: PageUser
            Text: string
            Replies: Post list option
            Time: string option
            StatusID: string option
            Url: string option
            Upvotes: int option
            CommentCount: int option
            IsTopLevel: bool option }

    type Page =
        {   Site: string
            Url: string
            Posts: Post list
            ActivePost: Post option }
