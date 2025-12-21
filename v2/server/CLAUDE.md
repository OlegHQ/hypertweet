# F# Web API Architecture Guide

Minimal boilerplate F# web API with clean architecture.

## Commands

- `dotnet build` - Build
- `dotnet run` - Run server

## Architecture

```
src/
  Shared/                    # Foundation (no deps)
    Errors.fs                # DomainError discriminated union
    Config.fs                # AppConfig record + loader
    Prelude.fs               # Computation expressions, helpers

  Domain/                    # Pure entities (depends on: Shared)
    <Entity>.fs              # Domain types with single-case DUs

  Data/                      # Shared repositories (depends on: Shared, Domain)
    <Entity>Repository.fs    # ONLY for entities used by multiple features

  Infrastructure/            # External services (depends on: Shared, Domain)
    Database.fs              # Database connection
    Jwt.fs                   # Token generation (if needed)

  Features/                  # Vertical slices (depends on: all above)
    <Feature>/
      Types.fs               # DTOs, commands, deps record
      [Repository.fs]        # ONLY for feature-specific entities
      Service.fs             # Business logic
      Handlers.fs            # HTTP handlers

Program.fs                   # Composition root
```

## Dependency Flow

```
              Shared
                |
              Domain
              /    \
           Data    Infrastructure
             \      /
           Features/*
                |
           Program.fs
```

**Key principle:** Features are siblings - they never import each other.

## Repository Placement

**Shared entities** (used by multiple features) → `Data/<Entity>Repository.fs`
**Feature-specific entities** → `Features/<Feature>/Repository.fs`

Example:
- User (used by Auth, Tones, future features) → `Data/UserRepository.fs`
- Tone (only used by Tones feature) → `Features/Tones/Repository.fs`

## Style Guide

### Minimize type annotations
F# infers types. Only annotate when:
- Compiler complains
- Disambiguating overlapping record fields

```fsharp
// Good - let inference work
let create deps cmd = asyncResult { ... }

// Only when needed for disambiguation
let entity: MyEntity = { Id = ...; Field = cmd.Field; ... }
```

### Single-case DUs for type safety
```fsharp
type EntityId = EntityId of string
type EmailAddress = EmailAddress of string
```

### Pattern match to unwrap DUs
```fsharp
// Inline destructuring - no wrapper modules needed
let (EntityId id) = entity.Id

// In function parameters
let findById db (EntityId id) = ...
```

### Use computation expressions
```fsharp
// asyncResult for async + Result
let myService deps cmd = asyncResult {
    let! data = deps.GetData cmd.Id
    do! deps.Save data
}

// result for sync validation
let validate req = result {
    do! if String.IsNullOrWhiteSpace req.Field then Error (ValidationError("field", "required")) else Ok ()
    return { Field = req.Field; ... }
}
```

### Generic handler pattern
```fsharp
let private handler<'Req, 'Cmd, 'Resp> validate service onSuccess : HttpHandler =
    fun next ctx -> task {
        let! req = ctx.BindJsonAsync<'Req>()
        match validate req with
        | Error e -> return! toHttp e next ctx
        | Ok cmd ->
            match! service cmd |> Async.StartAsTask with
            | Ok r -> return! onSuccess r next ctx
            | Error e -> return! toHttp e next ctx
    }

// Usage - one line per endpoint
let create deps = handler validateCreate (Service.create deps) (fun () -> created ...)
let get deps = handler validateGet (Service.get deps) (fun r -> ok r)
```

### Repository pattern with tryDb
```fsharp
let private tryDb f = async {
    try return! f () |> Async.map Ok
    with ex -> return Error (InternalError ex.Message)
}

let findById db (EntityId id) =
    tryDb (fun () -> async {
        let! r = collection(db).Find(...).FirstOrDefaultAsync() |> Async.AwaitTask
        return r |> nullable |> Option.map toDomain
    })
```

## Adding a New Feature

### If entity is feature-specific (most common):

1. **Domain type** in `src/Domain/<Entity>.fs`:
   ```fsharp
   type EntityId = EntityId of string
   type Entity = { Id: EntityId; Field: string; CreatedAt: DateTime }

   module Entity =
       let newId () = EntityId (Guid.NewGuid().ToString())
   ```

2. **Feature folder** `src/Features/<Feature>/`:

   **Types.fs** - DTOs and dependency record:
   ```fsharp
   [<CLIMutable>]
   type CreateRequest = { Field: string }

   type CreateCommand = { Field: string }

   type FeatureDeps = {
       Insert: Entity -> AsyncResult<unit, DomainError>
       FindById: EntityId -> AsyncResult<Entity option, DomainError>
   }
   ```

   **Repository.fs** - Database access (in Features folder):
   ```fsharp
   [<CLIMutable>]
   type EntityDocument = { [<BsonId>] Id: string; Field: string }

   module Repository =
       let insert db entity = tryDb (fun () -> async { ... })
       let findById db (EntityId id) = tryDb (fun () -> async { ... })
   ```

   **Service.fs** - Business logic:
   ```fsharp
   module Service =
       let create deps cmd = asyncResult {
           let entity = { Id = Entity.newId (); Field = cmd.Field; CreatedAt = DateTime.UtcNow }
           do! deps.Insert entity
       }
   ```

   **Handlers.fs** - HTTP handlers:
   ```fsharp
   module Handlers =
       let private validate req = result {
           do! if String.IsNullOrWhiteSpace req.Field then Error (ValidationError("field", "required")) else Ok ()
           return { Field = req.Field }
       }

       let create deps = handler validate (Service.create deps) (fun () -> created {| message = "Created" |})
   ```

3. **Add to .fsproj** (order matters!):
   ```xml
   <Compile Include="src/Domain/<Entity>.fs" />
   <Compile Include="src/Features/<Feature>/Types.fs" />
   <Compile Include="src/Features/<Feature>/Repository.fs" />
   <Compile Include="src/Features/<Feature>/Service.fs" />
   <Compile Include="src/Features/<Feature>/Handlers.fs" />
   ```

4. **Wire in Program.fs**:
   ```fsharp
   module FeatureRepo = MyApp.Features.Feature.Repository

   let featureDeps = {
       Insert = FeatureRepo.insert db
       FindById = FeatureRepo.findById db
   }

   let routes = choose [
       POST >=> route "/entities" >=> FeatureHandlers.create featureDeps
   ]
   ```

### If entity is shared (used by multiple features):

Put repository in `Data/` layer instead of `Features/<Feature>/`:

```fsharp
// src/Data/UserRepository.fs
namespace MyApp.Data

module UserRepository =
    let findById db (UserId id) = ...
    let findByEmail db (Email email) = ...
    let insert db user = ...
    let update db user = ...
```

Then multiple features can use it via their deps:

```fsharp
// Auth feature uses UserRepository
let authDeps = {
    FindUserByEmail = UserRepository.findByEmail db
    InsertUser = UserRepository.insert db
}

// Tones feature also uses UserRepository
let toneDeps = {
    GetUser = UserRepository.findById db
    UpdateUser = UserRepository.update db
}
```

## File Order in .fsproj

F# compiles top-to-bottom. Dependencies must come before dependents:

```xml
<!-- 1. Shared -->
<Compile Include="src/Shared/Errors.fs" />
<Compile Include="src/Shared/Config.fs" />
<Compile Include="src/Shared/Prelude.fs" />

<!-- 2. Domain -->
<Compile Include="src/Domain/User.fs" />
<Compile Include="src/Domain/Tone.fs" />

<!-- 3. Data (shared repositories) -->
<Compile Include="src/Data/UserRepository.fs" />

<!-- 4. Infrastructure -->
<Compile Include="src/Infrastructure/Database.fs" />
<Compile Include="src/Infrastructure/Jwt.fs" />

<!-- 5. Features -->
<Compile Include="src/Features/Auth/Types.fs" />
<Compile Include="src/Features/Auth/Service.fs" />
<Compile Include="src/Features/Auth/Handlers.fs" />
<Compile Include="src/Features/Tones/Types.fs" />
<Compile Include="src/Features/Tones/Repository.fs" />
<Compile Include="src/Features/Tones/Service.fs" />
<Compile Include="src/Features/Tones/Handlers.fs" />

<!-- 6. Entry -->
<Compile Include="Program.fs" />
```

## Core Components

### Shared/Errors.fs
```fsharp
type DomainError =
    | ValidationError of field: string * message: string
    | NotFound of entity: string
    | Conflict of message: string
    | Unauthorized
    | InternalError of message: string
```

### Shared/Prelude.fs
```fsharp
type AsyncResult<'T, 'E> = Async<Result<'T, 'E>>

module AsyncResult =
    let retn x = async { return Ok x }
    let error e = async { return Error e }
    let bind f ar = async { match! ar with Ok x -> return! f x | Error e -> return Error e }

type AsyncResultBuilder() =
    member _.Return x = async { return Ok x }
    member _.ReturnFrom x = x
    member _.Bind(ar, f) = AsyncResult.bind f ar
    member _.Zero() = async { return Ok () }

type ResultBuilder() =
    member _.Return x = Ok x
    member _.ReturnFrom x = x
    member _.Bind(r, f) = Result.bind f r
    member _.Zero() = Ok ()

[<AutoOpen>]
module Builders =
    let asyncResult = AsyncResultBuilder()
    let result = ResultBuilder()
    let isNull x = obj.ReferenceEquals(x, null)
    let nullable x = if isNull x then None else Some x

module Async =
    let map f a = async { let! x = a in return f x }
```

## Key Patterns

### Dependency injection via records
Pass dependencies as function records, not interfaces:
```fsharp
type Deps = {
    GetData: Id -> AsyncResult<Data option, DomainError>
    Save: Data -> AsyncResult<unit, DomainError>
}
```

### Railway-oriented programming
Chain operations with `asyncResult {}`. Errors short-circuit:
```fsharp
let process deps cmd = asyncResult {
    let! existing = deps.Find cmd.Id          // Error? Stop here
    do! deps.Validate existing                 // Error? Stop here
    do! deps.Save { existing with ... }        // Error? Stop here
    return existing.Id                         // Success path
}
```

### Validation in handlers
Keep domain pure. Validate at HTTP boundary:
```fsharp
let validate req = result {
    do! if condition then Error (ValidationError(...)) else Ok ()
    return command
}
```

### Error mapping to HTTP
```fsharp
let toHttp = function
    | ValidationError (f, m) -> badRequest {| error = m; field = f |}
    | NotFound e -> notFound {| error = $"{e} not found" |}
    | Conflict m -> conflict {| error = m |}
    | Unauthorized -> unauthorized ...
    | InternalError _ -> internalError {| error = "Internal error" |}
```

## Environment Variables

Configure via environment for different deployments:
```fsharp
let loadConfig () = {
    DatabaseUri = Environment.GetEnvironmentVariable "DATABASE_URI" |? "default"
    JwtSecret = Environment.GetEnvironmentVariable "JWT_SECRET" |? "dev-secret"
    // ...
}
```
