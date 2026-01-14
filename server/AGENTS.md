# Go Web API Architecture Guide

Minimal boilerplate Go web API using standard library. Feature-based package structure.

## Commands

- `make build` - Build server binary to `./bin/server`
- `make run` - Run server directly with `go run`
- `make test` - Run all tests
- `make fmt` - Format code
- `make lint` - Run go vet

## Architecture

```
cmd/
  server/
    main.go              # Entry point, wiring, routes

internal/
  config/
    config.go            # Environment config loading

  db/
    mongo.go             # MongoDB connection

  middleware/
    auth.go              # JWT authentication
    cors.go              # CORS headers
    logging.go           # Request logging

  shared/
    errors.go            # DomainError types
    validate.go          # Validation helpers
    response.go          # HTTP response helpers

  auth/
    types.go             # User struct, request/response types
    errors.go            # ErrUserNotFound, etc.
    repo.go              # UserRepo - database access
    service.go           # JWT generation, password hashing
    handler.go           # HTTP handlers

  profiles/
    types.go             # Profile struct, model config
    errors.go            # Domain errors
    repo.go              # ProfileRepo
    handler.go           # HTTP handlers

  tones/
    types.go             # Tone struct, defaults
    errors.go            # Domain errors
    repo.go              # ToneRepo
    handler.go           # HTTP handlers

  ai/
    types.go             # Page, Post, request/response types
    errors.go            # AI errors
    groq.go              # Groq API client
    prompts.go           # Prompt builders
    service.go           # AI orchestration
    handler.go           # HTTP handlers (incl. SSE)

  tracing/
    types.go             # TraceEvent struct
    repo.go              # TraceRepo with TTL
```

## Key Principles

1. **Feature packages** - Each feature is self-contained
2. **Single struct for BSON + JSON** - Same type for DB and API
3. **Explicit dependency injection** - Pass db/config via constructor, no globals
4. **Error wrapping** - Every error wrapped with context
5. **slog for logging** - Structured logging

## Handler Pattern

```go
type Handler struct {
    repo *UserRepo
    log  *slog.Logger
}

func NewHandler(repo *UserRepo, log *slog.Logger) *Handler {
    return &Handler{repo: repo, log: log}
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // 1. Parse
    req, err := shared.DecodeJSON[CreateRequest](r)
    if err != nil {
        shared.HandleError(w, h.log, err)
        return
    }

    // 2. Validate
    if err := shared.ValidateEmail("email", req.Email); err != nil {
        shared.HandleError(w, h.log, err)
        return
    }

    // 3. Execute
    user, err := h.repo.Insert(ctx, &User{...})
    if err != nil {
        shared.HandleError(w, h.log, err)
        return
    }

    // 4. Respond
    shared.RespondJSON(w, http.StatusCreated, user)
}
```

## Repository Pattern

```go
type UserRepo struct {
    coll *mongo.Collection
}

func NewUserRepo(db *mongo.Database) *UserRepo {
    return &UserRepo{coll: db.Collection("users")}
}

func (r *UserRepo) FindByID(ctx context.Context, id string) (*User, error) {
    var user User
    err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
    if errors.Is(err, mongo.ErrNoDocuments) {
        return nil, ErrUserNotFound  // domain error
    }
    if err != nil {
        return nil, fmt.Errorf("find user: %w", err)  // wrap with context
    }
    return &user, nil
}
```

## Error Handling

```go
// Domain errors in feature/errors.go
var (
    ErrUserNotFound = errors.New("user not found")
    ErrUserAlreadyExists = errors.New("user already exists")
)

// Wrap errors with context
return nil, fmt.Errorf("find user %s: %w", id, err)

// Handle in handler
if errors.Is(err, ErrUserNotFound) {
    shared.HandleError(w, h.log, shared.NewNotFoundError("user"))
    return
}
```

## Adding a New Feature

1. Create package under `internal/`:
   ```
   internal/newfeature/
     types.go     # Structs with bson/json tags
     errors.go    # Domain errors
     repo.go      # Database access
     handler.go   # HTTP handlers
   ```

2. Wire in `cmd/server/main.go`:
   ```go
   newRepo := newfeature.NewRepo(database)
   newHandler := newfeature.NewHandler(newRepo, log)

   mux.HandleFunc("GET /new", newHandler.List)
   mux.HandleFunc("POST /new", newHandler.Create)
   ```

## Route Registration (Go 1.22+)

```go
mux := http.NewServeMux()

// Health check - use {$} for exact root path only
mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("working"))
})

// Public routes
mux.HandleFunc("POST /auth/register", authHandler.Register)
mux.HandleFunc("POST /auth/login", authHandler.Login)

// Protected routes - wrap each route individually with auth middleware
mux.Handle("GET /profile", authMiddleware.Protect(http.HandlerFunc(profileHandler.GetProfile)))
mux.Handle("PUT /tones/{id}", authMiddleware.Protect(http.HandlerFunc(toneHandler.Update)))
```

**IMPORTANT**: Do NOT use a nested ServeMux for protected routes like `mux.Handle("/", authMiddleware.Protect(protected))`. This causes `GET /` to catch all paths. Register each protected route individually.

## Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017
GROQ_API_KEY=your-api-key

# Optional
PORT=5001
JWT_SECRET=your-secret-key
```

## Dependencies

- `go.mongodb.org/mongo-driver` - MongoDB driver
- `github.com/golang-jwt/jwt/v5` - JWT handling
- `golang.org/x/crypto` - BCrypt password hashing
- `github.com/google/uuid` - UUID generation

## Critical Gotchas

### BSON Field Names Must Be PascalCase

**This is critical for F# data compatibility.** The existing MongoDB data was created by an F# server that uses PascalCase for BSON field names. All Go structs must use PascalCase BSON tags to read/write existing data correctly.

```go
// CORRECT - matches existing F# data
type User struct {
    ID           string `bson:"_id" json:"id"`
    Email        string `bson:"Email" json:"email"`        // PascalCase
    PasswordHash string `bson:"PasswordHash" json:"-"`     // PascalCase
}

// WRONG - will not find existing data
type User struct {
    Email        string `bson:"email" json:"email"`        // camelCase - BREAKS!
    PasswordHash string `bson:"passwordHash" json:"-"`     // camelCase - BREAKS!
}
```

Also use PascalCase in queries and updates:
```go
// Queries
r.coll.FindOne(ctx, bson.M{"Email": email})      // PascalCase
r.coll.Find(ctx, bson.M{"UserId": userID})       // PascalCase

// Updates
bson.M{"$set": bson.M{"Title": title}}           // PascalCase
```

### MongoDB Unique Index with Partial Filter

When creating unique indexes on fields that may be null/missing in existing documents, use a partial filter expression:

```go
{
    Keys:    bson.D{{Key: "Email", Value: 1}},
    Options: options.Index().
        SetUnique(true).
        SetPartialFilterExpression(bson.M{"Email": bson.M{"$type": "string"}}),
}
```

This prevents `E11000 duplicate key error` on documents with null values.

## Code Quality Standards

- All code must compile without errors
- Use `go fmt` before committing
- Use `go vet` to catch issues
- Every error must be wrapped with context
- No global variables - pass dependencies explicitly
