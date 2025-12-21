namespace HypertweetServer.Shared

type DomainError =
    | ValidationError of field: string * message: string
    | NotFound of entity: string
    | Conflict of message: string
    | Unauthorized
    | InternalError of message: string
