namespace HypertweetServer.Features.Auth

open System
open Giraffe
open HypertweetServer.Domain
open HypertweetServer.Shared


module Validate =
    let notEmpty field value =
        if String.IsNullOrWhiteSpace value then
            Error(ValidationError(field, "cannot be empty"))
        else
            Ok value

    let minLength field len (value: string) =
        if value.Length < len then
            Error(ValidationError(field, $"must be at least {len} characters"))
        else
            Ok value

    let matches field pattern (value: string) =
        if System.Text.RegularExpressions.Regex.IsMatch(value, pattern) then
            Ok value
        else
            Error(ValidationError(field, "invalid format"))

    let email field value =
        value
        |> notEmpty field
        |> Result.bind (matches field @"^[^@\s]+@[^@\s]+\.[^@\s]+$")

    let chain validators value =
        validators |> List.fold (fun acc v -> Result.bind v acc) (Ok value)

module Handlers =
    let private toHttp =
        function
        | ValidationError(field, msg) -> RequestErrors.badRequest (json {| error = msg; field = field |})
        | NotFound entity -> RequestErrors.notFound (json {| error = $"{entity} not found" |})
        | Conflict msg -> RequestErrors.conflict (json {| error = msg |})
        | Unauthorized -> RequestErrors.unauthorized "Bearer" "HyperTweet" (json {| error = "Invalid credentials" |})
        | InternalError _ -> ServerErrors.internalError (json {| error = "Internal server error" |})

    let private handler<'Req, 'Cmd, 'Resp>
        (validate: 'Req -> Result<'Cmd, DomainError>)
        (service: 'Cmd -> Async<Result<'Resp, DomainError>>)
        (onSuccess: 'Resp -> HttpHandler)
        : HttpHandler =
        fun next ctx ->
            task {
                let! req = ctx.BindJsonAsync<'Req>()

                match validate req with
                | Error e -> return! toHttp e next ctx
                | Ok cmd ->
                    match! service cmd |> Async.StartAsTask with
                    | Ok r -> return! onSuccess r next ctx
                    | Error e -> return! toHttp e next ctx
            }

    let private validateRegister (req: RegisterRequest) =
        result {
            let! email = req.Email |> Validate.email "email"

            let! password =
                req.Password
                |> Validate.chain [ Validate.notEmpty "password"; Validate.minLength "password" 8 ]

            return
                { RegisterCommand.Email = Email email
                  Password = password }
        }



    let private validateLogin (req: LoginRequest) =
        result {
            let! email = req.Email |> Validate.email "email"
            let! password = req.Password |> Validate.notEmpty "password"

            return
                { Email = Email email
                  Password = password }
        }

    let private validateRefresh (req: RefreshRequest) =
        result {
            let! refreshToken = req.RefreshToken |> Validate.notEmpty "refreshToken"
            return { RefreshCommand.RefreshToken = refreshToken }
        }

    let register deps =
        handler validateRegister (Service.register deps) (fun () ->
            Successful.created (json {| message = "User created" |}))

    let login deps =
        handler validateLogin (Service.login deps) (fun t -> Successful.ok (json t))

    let refresh deps =
        handler validateRefresh (Service.refresh deps) (fun t -> Successful.ok (json {| token = t |}))

