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
- **Model Selection** - Choose from 8 free-tier LLMs via OpenRouter

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
                    │   F# API    │
                    │   Server    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌────┴────┐ ┌─────┴─────┐
        │  MongoDB  │ │   JWT   │ │ OpenRouter│
        │           │ │  Auth   │ │    AI     │
        └───────────┘ └─────────┘ └───────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Extension | TypeScript, React 19, Emotion, React Query |
| Build | Bun, esbuild |
| Server | F#, Giraffe, .NET 8 |
| Database | MongoDB |
| Auth | JWT + BCrypt |
| AI | OpenRouter API (free-tier models) |

## Development

### Prerequisites

- [Bun](https://bun.sh)
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
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

# Run development server (port 3000)
dotnet run

# Build release
dotnet build --configuration Release

# Run tests
dotnet test
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
└── server/                 # F# backend
    └── src/
        ├── Shared/         # Config, HTTP helpers, validation
        ├── Domain/         # Models, database access
        ├── Features/       # Vertical slices
        │   ├── Auth/       # Login, register, refresh
        │   ├── Tones/      # CRUD, toggle, list
        │   └── Profiles/   # Model selection, password
        ├── AI/             # OpenRouter integration
        │   ├── Service.fs  # Generation logic
        │   └── Prompts.fs  # Platform-specific templates
        └── Program.fs      # Composition root
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

Server configuration via environment variables or `appsettings.json`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `OPENROUTER_API_KEY` | OpenRouter API key |

## Available AI Models

All free-tier models via OpenRouter:

- xiaomi/mimo-v2-flash:free (default)
- deepseek/deepseek-r1-0528:free
- deepseek/deepseek-chat-v3-0324:free
- meta-llama/llama-3.1-405b-instruct:free
- google/gemini-2.0-flash-exp:free
- google/gemma-3-27b-it:free
- qwen/qwen3-235b-a22b:free
- mistralai/mistral-small-3.1-24b-instruct:free

## License

MIT
