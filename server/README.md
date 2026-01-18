# HyperTweet Server

Go web API backend for the HyperTweet browser extension.

## Prerequisites

- Go 1.22+
- MongoDB (local or remote)

## Quick Start

```bash
# Set required environment variable
export GROQ_API_KEY="your-groq-api-key"

# Run the server (development)
make run

# Or directly with go
go run ./cmd/server

# Build binary
make build
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `JWT_SECRET` | `super-secret-key-change-in-production` | JWT signing secret |
| `GROQ_API_KEY` | (required) | Groq API key for AI features |
| `PORT` | `5001` | Server port |

## Example with custom config

```bash
MONGODB_URI="mongodb://user:pass@host:27017" \
JWT_SECRET="my-secret" \
GROQ_API_KEY="your-key" \
make run
```

## API Endpoints

The server runs on `http://localhost:5001` by default.

### Public Routes
- `GET /` - Health check
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/refresh` - Refresh access token

### Protected Routes (require Bearer token)
- `GET /profile` - Get user profile
- `POST /profile/update` - Update profile settings
- `POST /profile/password` - Change password
- `DELETE /users` - Delete account
- `GET /profile/available-models` - List AI models

- `GET /tones` - List user tones
- `POST /tones` - Create custom tone
- `PUT /tones/{id}` - Update tone
- `DELETE /tones/{id}` - Delete tone
- `POST /tones/{id}/toggle` - Toggle default tone

- `GET /api-tokens` - List MCP/API tokens
- `POST /api-tokens` - Create MCP/API token (returned once)
- `POST /api-tokens/{id}/revoke` - Revoke MCP/API token

- `POST /ai/reply` - Generate reply with tone
- `POST /ai/refine` - Refine existing reply
- `POST /ai/chat` - Chat with AI (SSE streaming)

### MCP (Claude Code)
- `POST /mcp` - MCP endpoint (Streamable HTTP). Requires `Authorization: Bearer <mcp-token>`.

## Development

```bash
# Format code
make fmt

# Run linter
make lint

# Run tests
make test

# Clean build artifacts
make clean
```
