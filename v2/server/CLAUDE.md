# F# Web API Architecture Guide

Minimal boilerplate F# web API. No unnecessary abstraction layers.

## Commands

- `dotnet build` - Build
- `dotnet run` - Run server

## Architecture

```
src/
  Shared/                    # Foundation (no deps)
    Errors.fs                # DomainError discriminated union
    Config.fs                # AppConfig record + loader
    Http.fs                  # HTTP helpers, error handling
    Db.fs                    # Database helpers
    Validate.fs              # Validation combinators

  Domain/                    # Pure entities (depends on: Shared)
    Models.fs                # Domain types
    DataAccess.fs            # Collection accessors, common queries

  Infrastructure/            # External services (depends on: Shared, Domain)
    Jwt.fs                   # Token generation

  Features/                  # Vertical slices (depends on: all above)
    <Feature>/
      [Types.fs]             # Optional: DTOs and commands (can go in Handlers.fs)
      Handlers.fs            # Everything: validation, logic, DB ops, types if simple

Program.fs                   # Composition root, routes
```

**Key principle:** No Service layer. No Repository layer. Handlers do everything.

## Golden Standard: Auth/Handlers.fs

This is the pattern to follow. All logic lives in the handler:

```fsharp
module Handlers =
    // Validation - private, returns Result
    let private validateLogin (req: LoginRequest) =
        result {
            let! email = req.Email |> Validate.email "email"
            let! password = req.Password |> Validate.notEmpty "password"
            return { Email = email; Password = password }
        }

    // Data access helpers - reuse DataAccess or define inline
    let userByEmail db = DataAccess.userByKey db "Email"

    // Small helper functions - defined right here, not in separate files
    let createTokenResult config user =
        let accessToken = Jwt.generateToken config user
        let refreshToken = Jwt.generateRefreshToken ()
        { AccessToken = accessToken
          RefreshToken = refreshToken
          ExpiresIn = config.JwtExpiryDays * 24 * 60 * 60 }

    // Handler - uses taskResult, does EVERYTHING inline
    let login config db next ctx =
        taskResult {
            let! req = HttpCtx.bindJson<LoginRequest> ctx |> Task.map validateLogin

            let! user =
                userByEmail db req.Email
                |> Async.map (Result.bind (Result.requireSome (NotFound "User")))

            let result = createTokenResult config user

            let expiry = System.DateTime.UtcNow.AddDays 30.0
            do! updateRefreshToken user.Id result.RefreshToken expiry db

            return! json result next ctx
        }
        |> HttpCtx.errHandle next ctx
```

## What NOT to Do

**Don't create:**
- `Service.fs` files - put logic in handlers
- `Repository.fs` files - use `Db` module directly
- Dependency injection records - pass `db` and `config` as parameters
- Abstractions for things used once

**Don't:**
```fsharp
// BAD: Unnecessary abstraction
type AuthDeps = {
    FindUserByEmail: string -> AsyncResult<User option, DomainError>
    InsertUser: User -> AsyncResult<unit, DomainError>
}

module Service =
    let login deps cmd = asyncResult {
        let! user = deps.FindUserByEmail cmd.Email
        // ...
    }

module Handlers =
    let login deps = handler validateLogin (Service.login deps) (fun r -> json r)
```

**Do:**
```fsharp
// GOOD: Direct, no indirection
let login config db next ctx =
    taskResult {
        let! req = HttpCtx.bindJson<LoginRequest> ctx |> Task.map validateLogin
        let! user = userByEmail db req.Email |> Async.map (Result.bind (Result.requireSome (NotFound "User")))
        // ... all logic right here
        return! json result next ctx
    }
    |> HttpCtx.errHandle next ctx
```

## Adding a New Feature

1. **Types.fs** (optional) - Only if types are complex or reused:
   ```fsharp
   namespace MyApp.Features.Thing

   [<CLIMutable>]
   type CreateRequest = { Name: string; Value: int }

   type CreateCommand = { Name: string; Value: int }

   type ThingResponse = { Id: string; Name: string }
   ```

2. **Handlers.fs** - Everything else:
   ```fsharp
   namespace MyApp.Features.Thing

   open Giraffe
   open FsToolkit.ErrorHandling
   open MyApp.Shared
   open MyApp.Domain

   module Handlers =
       // Validation
       let private validateCreate (req: CreateRequest) =
           result {
               let! name = req.Name |> Validate.notEmpty "name"
               let! value = req.Value |> Validate.positive "value"
               return { CreateCommand.Name = name; Value = value }
           }

       // Data access helpers (if needed beyond DataAccess module)
       let thingCol db = Db.collection<Thing> db "things"

       // Handlers - all logic inline
       let create db next ctx =
           taskResult {
               let! req = HttpCtx.bindJson<CreateRequest> ctx |> Task.map validateCreate

               let thing = {
                   Id = newId ()
                   Name = req.Name
                   Value = req.Value
                   CreatedAt = System.DateTime.UtcNow
               }

               do! thingCol db |> Db.insertOne thing
               return! json { Id = thing.Id; Name = thing.Name } next ctx
           }
           |> HttpCtx.errHandle next ctx

       let get db id next ctx =
           taskResult {
               let! thing =
                   thingCol db
                   |> Db.findOne (Bson.make () |> Bson.field "_id" id)
                   |> Async.map (Result.bind (Result.requireSome (NotFound "Thing")))

               return! json thing next ctx
           }
           |> HttpCtx.errHandle next ctx
   ```

3. **Wire in Program.fs**:
   ```fsharp
   let routes = choose [
       POST >=> route "/things" >=> ThingHandlers.create db
       GET >=> routef "/things/%s" (ThingHandlers.get db)
   ]
   ```

4. **Add to .fsproj**:
   ```xml
   <!-- Types.fs only if needed -->
   <Compile Include="src/Features/Thing/Handlers.fs" />
   ```

## Style Guide

### Use taskResult from FsToolkit.ErrorHandling
```fsharp
let handler db next ctx =
    taskResult {
        let! req = HttpCtx.bindJson<Request> ctx |> Task.map validate
        let! data = someAsyncOp db |> Async.map someResultTransform
        do! anotherOp data
        return! json response next ctx
    }
    |> HttpCtx.errHandle next ctx
```

### Validation with combinators
```fsharp
let private validate (req: Request) =
    result {
        let! email = req.Email |> Validate.email "email"
        let! password = req.Password |> Validate.chain [
            Validate.notEmpty "password"
            Validate.minLength "password" 8
        ]
        return { Email = email; Password = password }
    }
```

### Result helpers for Option handling
```fsharp
// Convert Option to Result with error
let! user = findUser db id |> Async.map (Result.bind (Result.requireSome (NotFound "User")))

// Check something doesn't exist
let! existing = findByEmail db email
do! existing |> Result.requireNone (Conflict "Already exists")
```

### DataAccess for shared queries
```fsharp
// Domain/DataAccess.fs - collection accessors and common queries
module DataAccess =
    let userCol db = Db.collection<User> db "users"
    let userByKey db key value = userCol db |> Db.findOne (Bson.make () |> Bson.field key value)
    let user db id = userByKey db "_id" id
```

### Handler-local helpers for feature-specific logic
```fsharp
// In Handlers.fs - not in a separate file
let userByEmail db = DataAccess.userByKey db "Email"

let createTokenResult config user =
    { AccessToken = Jwt.generateToken config user
      RefreshToken = Jwt.generateRefreshToken ()
      ExpiresIn = config.JwtExpiryDays * 24 * 60 * 60 }
```

## File Order in .fsproj

F# compiles top-to-bottom:

```xml
<!-- 1. Shared -->
<Compile Include="src/Shared/Errors.fs" />
<Compile Include="src/Shared/Config.fs" />
<Compile Include="src/Shared/Db.fs" />
<Compile Include="src/Shared/Http.fs" />
<Compile Include="src/Shared/Validate.fs" />

<!-- 2. Domain -->
<Compile Include="src/Domain/Models.fs" />
<Compile Include="src/Domain/DataAccess.fs" />

<!-- 3. Infrastructure -->
<Compile Include="src/Infrastructure/Jwt.fs" />

<!-- 4. Features (Types.fs before Handlers.fs if present) -->
<Compile Include="src/Features/Auth/Types.fs" />
<Compile Include="src/Features/Auth/Handlers.fs" />
<Compile Include="src/Features/Thing/Handlers.fs" />

<!-- 5. Entry -->
<Compile Include="Program.fs" />
```

## Core Errors

```fsharp
type DomainError =
    | ValidationError of field: string * message: string
    | NotFound of entity: string
    | Conflict of message: string
    | Unauthorized
    | InternalError of message: string
```

## Summary

- **1-2 files per feature**: Handlers.fs (required) + Types.fs (optional)
- **No Service layer**: Logic lives in handlers
- **No Repository layer**: Use Db module directly
- **No dependency records**: Pass db/config as parameters
- **taskResult**: FsToolkit.ErrorHandling for async+result
- **Inline helpers**: Define in Handlers.fs, not separate files
