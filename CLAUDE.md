# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Extension Development

- `just install` - Install dependencies with Bun
- `just watch` - Build and watch Chrome extension with auto-reload
- `just build` - Production build of Chrome extension  
- `just dev` - Clean build directory and start watch mode
- `just prod` - Clean build and create production build
- `just format` - Format TypeScript/JavaScript files with Prettier
- `just lint` - Run ESLint with auto-fix
- `just typecheck` - Run TypeScript type checking
- `just check` - Run all validation checks
- `just clean` - Remove extension/dist directory

### Server Development

- `cargo run` - Build and run development server on port 3000
- `cargo build` - Build server in debug mode
- `cargo build --release` - Build optimized release version
- `cargo test` - Run all server tests
- `cargo fmt` - Format Rust code
- `cargo clippy` - Run Clippy linter

## Architecture Overview

This is a browser extension system for generating AI-powered contextual replies on social media platforms. The project consists of two main components: a TypeScript browser extension and a Rust backend server.

**System Purpose**: Help users generate intelligent, contextual responses on Twitter/X, Reddit, and LinkedIn using AI-powered tone management and response generation modes.

### Extension Architecture

**Location**: `extension/` directory (contains all UI/frontend code and build system)  
**Build Output**: `extension/dist/` (Chrome extension ready to load)  
**Entry Point**: `content.ts` - injected into social media pages  
**Package Manager**: Bun for fast package management and script running

1. **Content Script System** (`content.ts`)
   - Single entry point that initializes the Router system
   - Automatically detects current social platform and scrapes page data
   - Manifest v3 extension with `activeTab` permissions

2. **Platform Router** (`router.ts`)
   - Site detection based on hostname (x.com, twitter.com, reddit.com, linkedin.com)
   - Factory pattern returning appropriate scraper for detected platform
   - Enum-based site type management

3. **Abstract Scraper Pattern** (`base.ts`)
   - Base abstract class defining scraper interface
   - Two core methods: `readPage()` and `insertReply(text: string)`
   - Platform-specific implementations for each supported site

4. **Platform-Specific Scrapers**
   - `twitter.ts` - Twitter/X page scraping and reply insertion
   - `reddit.ts` - Reddit post and comment extraction
   - `linkedin.ts` - LinkedIn post and comment handling
   - Each scraper implements DOM parsing for their respective platform

5. **Data Models** (`models.ts`)
   - `Page` - Contains site URL, posts array, and active post
   - `User` - Profile data (username, bio, followers, verification, etc.)
   - `Post` - Content with author, text, replies, metrics, and metadata

### Server Architecture

**Location**: `server/` directory  
**Runtime**: Rust with Tokio async, listening on 0.0.0.0:3000  
**Database**: SQLite with d1-rs ORM (file: `db.sqlite3`)

1. **Web Server** (`src/main.rs`)
   - Axum framework with CORS enabled
   - Health check endpoint returning service status and timestamp
   - Authentication routes mounted at `/auth` prefix
   - Database connection shared via Axum state

2. **Database Layer** (`src/database.rs`)
   - d1-rs ORM with SQLite backend and auto-migration
   - Entity registration and schema management
   - Database file created automatically in project root

3. **Data Models** (`src/models.rs`)
   - `User` entity with d1-rs derive macros
   - Serde serialization for JSON API responses
   - Auto-migration compatible entity definitions

4. **Authentication System** (`src/auth.rs`)
   - JWT-based user authentication and registration
   - Email-based user accounts with secure password handling
   - User CRUD operations and account management
   - Tone management system for AI response generation modes

### Development Flow

**Extension → Server Communication**:

1. Extension content script scrapes social media page using platform-specific scraper
2. Extracted post data and user context sent to server API
3. Server processes request with user's tone preferences and AI configuration
4. AI-generated response returned to extension for insertion into page

### Build System

- **Extension**: Bun + esbuild-based bundling via justfile recipes  
  - All build tools located in `extension/` directory
  - Targets Chrome v90+ with ES modules and sourcemaps
  - Manifest and assets copied to `extension/dist/` directory
  - Watch mode for development, minification for production
  - Strict TypeScript and ESLint validation on every build

- **Server**: Standard Cargo build system with Rust 2024 edition
  - Multi-threaded Tokio runtime with comprehensive error handling
  - Development dependencies include tokio-test for async testing

### Key Dependencies

**Extension** (`extension/` directory):

- Bun for fast package management and script running
- TypeScript for type safety and modern JS features
- esbuild for fast bundling and watch mode
- ESLint with strict TypeScript rules for code quality
- Prettier for code formatting

**Server**:

- axum (0.8.4) - Modern async web framework
- tokio (1.47.1) - Async runtime with multi-threading
- d1-rs - ORM supporting SQLite and Cloudflare D1
- tower-http - CORS and HTTP middleware
- jsonwebtoken, bcrypt - Authentication and security
- serde/serde_json - JSON serialization

### Development Notes

- Extension requires loading unpacked extension in Chrome developer mode
- All UI/frontend code and build configuration is in `extension/` directory
- Use `just install` to install dependencies before first build
- Server auto-creates SQLite database on first run
- Content scripts have full access to social media page DOM
- Cross-origin requests handled via CORS configuration  
- All database operations use type-safe ORM with automatic migrations
- Nix flake provides complete development environment with Bun, Rust, and all tools

### Code Quality Standards

**STRICT POLICY: ZERO TOLERANCE FOR WARNINGS AND ERRORS**

- **No Compilation Errors**: All TypeScript code must compile without any errors
- **No Linting Warnings**: All code must pass ESLint checks with zero warnings in production builds
- **No Runtime Warnings**: Console warnings are prohibited in production code
- **No Placeholders**: No TODO comments, placeholder functions, or incomplete implementations allowed
- **Full Implementation Required**: Every feature must be completely implemented before commit
- **Type Safety**: All code must be strictly typed with no `any` types except where absolutely necessary
- **Build Validation**: All builds must pass linting, type checking, and formatting checks before success

The build system enforces these policies:

- Development builds warn on linting issues but continue
- Production builds fail immediately on any warnings or errors
- All code is auto-formatted with Prettier before commit
- ESLint runs with strict TypeScript rules enabled
