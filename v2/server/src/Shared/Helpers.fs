namespace HypertweetServer.Shared

open System

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
