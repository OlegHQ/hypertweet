# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Run

- `cargo run` - Build and run the development server on port 3000
- `cargo build` - Build the project in debug mode
- `cargo build --release` - Build optimized release version
- `cargo check` - Check code without building

### Testing

- `cargo test` - Run all tests
- `cargo test <test_name>` - Run specific test by name

### Code Quality

- `cargo fmt` - Format code using rustfmt
- `cargo clippy` - Run Clippy linter for code suggestions

## Development Policies

All code must adhere to these strict requirements:

1. **No Placeholders**: Everything must be fully implemented - no TODOs, placeholder comments, or incomplete functionality
2. **Tests Must Pass**: All tests must pass before considering any feature complete
3. **Zero Warnings**: Code must compile with no warnings whatsoever
4. **Type Safety**: No string literals or unsafe practices - use proper types, enums, and robust error handling
5. **Production-Level Error Handling**: All errors must be properly handled with appropriate error types and user-friendly messages

## Architecture Overview

This is a Rust web server for a browser extension system that generates AI-powered contextual responses. The server provides user authentication and tone management for an extension that helps users generate intelligent replies on social platforms.

**System Purpose**: Backend API for a browser extension that offers multiple response generation modes (insightful, metaphor, etc.) and editing capabilities for improving drafts and grammar cleanup.

The codebase uses Axum framework with SQLite database persistence and follows a modular structure with clear separation of concerns.

### Core Components

1. **Web Server** (`src/main.rs`)
   - Axum-based HTTP server listening on port 3000 (0.0.0.0:3000)
   - Single route handler currently returning "hey" at root path
   - Uses Tokio async runtime with multi-threading support

2. **Database Layer** (`src/database.rs`)
   - Uses d1-rs ORM for database operations with SQLite backend
   - Auto-migration system via `AutoSchemaClient`
   - Database file: `db.sqlite3` in project root
   - Initializes with `init_db()` function

3. **Data Models** (`src/models.rs`)
   - Entity definitions using d1-rs derive macros
   - `User` model with id, email, and password fields
   - Serde serialization/deserialization support

4. **Authentication** (`auth.rs`)
   - JWT-based authentication system for user login/registration
   - Email-based user registration and authentication
   - Account management and user CRUD operations
   - Tone management system for AI response generation modes

### Database Architecture

The application uses SQLite with d1-rs ORM which provides:

- Entity-based modeling with derive macros
- Automatic schema migrations
- Type-safe database operations
- Support for both local SQLite and Cloudflare D1 databases

### Key Dependencies

- **axum** (0.8.4) - Web application framework
- **tokio** (1.47.1) - Async runtime with multi-threading
- **tower-http** (0.6.6) - HTTP middleware and utilities
- **d1-rs** - ORM for SQLite/D1 database operations
- **serde/serde_json** - Serialization framework
- **rusqlite** (0.32.0) - SQLite database driver

### Development Notes

- Server runs on all interfaces (0.0.0.0) port 3000
- Database file is created automatically in project root
- Uses Rust 2024 edition
- System designed to support browser extension with AI-powered response generation
- Flow: Extension sends request type → Server API → AI-generated response back to extension
