# Hypertweet

AI-powered browser extension that generates intelligent, contextual replies on Twitter/X, Reddit, and LinkedIn.

## What It Does

Hypertweet reads the conversation you're replying to and generates contextually-aware responses using AI. Pick a tone, click once, and get a draft you can edit before posting.

**Supported Platforms:**
- X (Twitter)
- Reddit
- LinkedIn

## Features

- **5 Built-in Tones** - Professional, Friendly, Witty, Insightful, Casual
- **Custom Tones** - Create your own with free-form AI instructions
- **Thread-Aware** - Understands full conversation context, not just the parent post
- **Platform-Specific** - Follows character limits, formatting norms, and culture per site
- **Model Selection** - Choose from multiple models via Groq

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Extension                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Twitter   │  │   Reddit    │  │    LinkedIn     │  │
│  │   Scraper   │  │   Scraper   │  │     Scraper     │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         └────────────────┼──────────────────┘           │
│                    ┌─────┴─────┐                        │
│                    │  React UI │                        │
│                    └─────┬─────┘                        │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTPS
                     ┌──────┴──────┐
                     │    Go API   │
                     │   Server    │
                     └──────┬──────┘
                            │
               ┌────────────┼────────────┐
               │            │            │
         ┌─────┴─────┐ ┌────┴────┐ ┌─────┴─────┐
         │  MongoDB  │ │   JWT   │ │   Groq AI │
         │           │ │  Auth   │ │           │
         └───────────┘ └─────────┘ └───────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Extension | TypeScript, React 19, Emotion, React Query |
| Build | Bun, esbuild |
| Server | Go 1.22+ (stdlib net/http) |
| Database | MongoDB |
| Auth | JWT + BCrypt |
| AI | Groq API |

## Development

### Prerequisites

- [Bun](https://bun.sh)
- [Go](https://go.dev) (1.22+)
- [MongoDB](https://www.mongodb.com/docs/manual/installation/)

### Extension

```bash
cd extension

# Install dependencies
just install

# Development with hot reload
just dev

# Production build
just prod

# Run all checks (lint, typecheck, format)
just check
```

Load the unpacked extension from `extension/dist` in Chrome.

### Server

```bash
cd server

# Required
export GROQ_API_KEY="your-groq-api-key"

# Run development server
make run

# Run tests
make test
```

### Available Commands

**Extension (justfile):**

| Command | Description |
|---------|-------------|
| `just install` | Install dependencies |
| `just watch` | Build + watch with auto-reload |
| `just build` | Production build |
| `just dev` | Clean + watch |
| `just prod` | Clean + production build |
| `just format` | Prettier formatting |
| `just lint` | ESLint with auto-fix |
| `just typecheck` | TypeScript validation |
| `just check` | All validation checks |
| `just clean` | Remove dist directory |

## Project Structure

```
v2/
├── extension/              # Chrome extension
│   ├── src/
│   │   ├── content.ts      # Entry point, injected into pages
│   │   ├── router.ts       # Platform detection
│   │   ├── base.ts         # Abstract scraper interface
│   │   ├── twitter.ts      # X/Twitter scraper
│   │   ├── reddit.ts       # Reddit scraper
│   │   ├── linkedin.ts     # LinkedIn scraper
│   │   ├── models.ts       # Data types (Page, Post, User)
│   │   ├── api.ts          # Server API client
│   │   └── ui/             # React components
│   │       ├── Keyboard.tsx    # Main interaction UI
│   │       ├── AuthForm.tsx    # Login/register
│   │       ├── ToneEditor.tsx  # Custom tone creation
│   │       └── components/     # Shared UI primitives
│   ├── manifest.json
│   └── justfile
│
└── server/                 # Go backend
    ├── cmd/server/         # Server entrypoint
    └── internal/           # Feature packages
        ├── auth/           # Login, register, refresh (JWT)
        ├── profiles/       # Model selection, chat config
        ├── tones/          # Tone CRUD + defaults
        ├── apitokens/      # MCP token CRUD (revocable)
        ├── mcp/            # MCP endpoint (/mcp)
        └── ai/             # Groq integration
```

## How It Works

1. **Scrape** - Extension parses the current page, extracting the post you're replying to plus full thread context

2. **Generate** - Click a tone button to send the context + selected tone to the server

3. **Prompt** - Server builds a platform-aware prompt with:
   - Site-specific guidelines (character limits, culture, formatting)
   - Tone instruction (e.g., "Be professional and concise")
   - Thread conversation (nested replies, truncated for token limits)
   - Active post content

4. **Insert** - AI-generated reply is inserted into the reply textarea for editing before posting

## Configuration

Server configuration via environment variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `GROQ_API_KEY` | Groq API key |

## Claude Code MCP

Hypertweet exposes a Model Context Protocol (MCP) server at `POST /mcp` for managing tones and profile/chat settings.

1. In the extension UI, open **Settings → MCP** and generate a token.
2. Add the MCP server to Claude Code.

Example `.mcp.json` entry (project scope):

```json
{
  "mcpServers": {
    "hypertweet": {
      "type": "http",
      "url": "http://localhost:5001/mcp",
      "headers": {
        "Authorization": "Bearer ${HYPERTWEET_MCP_TOKEN}"
      }
    }
  }
}
```

Then run Claude Code with the env var set:

- `HYPERTWEET_MCP_TOKEN=<paste-token-here> claude`

## Available AI Models

Configured in `server/internal/profiles/types.go`.

- `openai/gpt-oss-120b` (default)
- `openai/gpt-oss-20b`
- `llama-3.3-70b-versatile`
- `llama-3.1-8b-instant`

## License

MIT
