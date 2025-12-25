[<AutoOpen>]
module Base.Prelude

type AsyncResult<'T, 'E> = Async<Result<'T, 'E>>

module AsyncResult =
    let retn x = async { return Ok x }
    let error e = async { return Error e }

    let bind f ar =
        async {
            match! ar with
            | Ok x -> return! f x
            | Error e -> return Error e
        }

type AsyncResultBuilder() =
    member _.Return x = async { return Ok x }
    member _.ReturnFrom x = x
    member _.Bind(ar, f) = AsyncResult.bind f ar
    member _.Zero() = async { return Ok() }

type ResultBuilder() =
    member _.Return x = Ok x
    member _.ReturnFrom x = x
    member _.Bind(r, f) = Result.bind f r
    member _.Zero() = Ok()

[<AutoOpen>]
module Builders =
    let asyncResult = AsyncResultBuilder()
    let result = ResultBuilder()
    let isNull x = obj.ReferenceEquals(x, null)
    let nullable x = if isNull x then None else Some x

module Async =
    let map f a =
        async {
            let! x = a
            return f x
        }

module Option =
    let requireSome error opt =
        match opt with
        | Some x -> Ok x
        | None -> Error error
