namespace HypertweetServer.Features.Auth

open Giraffe
open HypertweetServer.Domain
open HypertweetServer.Shared


module Handlers =
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

    let inline handler validate service onSuccess =
        Http.handler "Auth" validate service onSuccess

    let register deps =
        handler validateRegister (Service.register deps) (fun () ->
            Successful.created (json {| message = "User created" |}))

    let login deps =
        handler validateLogin (Service.login deps) (fun t -> Successful.ok (json t))

    let refresh deps =
        handler validateRefresh (Service.refresh deps) (fun t -> Successful.ok (json {| token = t |}))
