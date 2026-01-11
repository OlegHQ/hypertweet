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

// Public routes
mux.HandleFunc("POST /auth/register", authHandler.Register)
mux.HandleFunc("POST /auth/login", authHandler.Login)

// Protected routes - wrap with auth middleware
protected := http.NewServeMux()
protected.HandleFunc("GET /profile", profileHandler.GetProfile)
protected.HandleFunc("PUT /tones/{id}", toneHandler.Update)

mux.Handle("/", authMiddleware.Protect(protected))
```

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

## Code Quality Standards

- All code must compile without errors
- Use `go fmt` before committing
- Use `go vet` to catch issues
- Every error must be wrapped with context
- No global variables - pass dependencies explicitly
