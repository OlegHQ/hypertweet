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

**STRICT POLICY: ZERO TOLERANCE FOR WARNINGS, ERRORS, AND ANY TYPES**

#### TypeScript Requirements
- **No Compilation Errors**: All TypeScript code must compile without any errors
- **No `any` Types**: The `any` type is STRICTLY FORBIDDEN in all code
  - Use proper TypeScript types, interfaces, generics, and union types
  - Use `unknown` instead of `any` for truly unknown data, then narrow with type guards
  - Use assertion functions and type predicates for runtime type validation
  - Prefer type-safe alternatives: `Record<string, unknown>`, `object`, specific interfaces
  - Exception: Only `(globalThis as any)` is allowed for accessing global APIs not in TypeScript types
- **Strict Type Safety**: All code must be strictly typed with comprehensive type coverage
  - Use `exactOptionalPropertyTypes: true` and `noUncheckedIndexedAccess: true`
  - All function parameters and return types must be explicitly typed
  - All variable declarations should have inferred or explicit types
  - Use discriminated unions for state management and error handling
  - Implement proper type guards and assertion functions

#### Code Quality Requirements
- **No Linting Warnings**: All code must pass ESLint checks with zero warnings in production builds
- **No Runtime Warnings**: Console warnings are prohibited in production code
- **No Placeholders**: No TODO comments, placeholder functions, or incomplete implementations allowed
- **Full Implementation Required**: Every feature must be completely implemented before commit
- **Production-Level Code**: All code must meet enterprise production standards
  - Comprehensive error handling with typed error objects
  - Proper resource cleanup and memory management
  - Defensive programming with input validation
  - Immutable data structures where possible (readonly modifiers)
  - Pure functions and side-effect isolation

#### Architecture Requirements
- **Namespace Over Classes**: Use TypeScript namespaces instead of static-only classes
  - Static-only classes are code smells - use namespaces for utility functions
  - Classes should only be used for stateful objects with instance methods
- **Functional Programming**: Prefer functional programming patterns
  - Pure functions with no side effects
  - Immutable data structures
  - Function composition over inheritance
- **Type-First Design**: Design types before implementation
  - Define comprehensive interfaces and types first
  - Use branded types for domain-specific primitives
  - Implement proper data validation at boundaries

#### Build System Enforcement
The build system enforces these policies with zero tolerance:

- **Development builds**: Fail immediately on any TypeScript errors or `any` types
- **Production builds**: Fail immediately on any warnings, errors, or `any` types
- **Type checking**: `tsc --noEmit` must pass with strict settings
- **Linting**: ESLint with `@typescript-eslint/no-explicit-any: error`
- **Formatting**: All code is auto-formatted with Prettier before commit
- **Quality gates**: No commits allowed without passing all quality checks

#### Forbidden Patterns
- ❌ `any` type (except `globalThis as any` for global API access)
- ❌ `@ts-ignore` or `@ts-expect-error` comments
- ❌ Static-only classes (use namespaces instead)
- ❌ Untyped function parameters or return values
- ❌ Implicit `any` from missing types
- ❌ Non-null assertions (`!`) without proper justification
- ❌ Type assertions without runtime validation

#### Common TypeScript Patterns (Must Use From Start)

**Event Handlers:**
```typescript
// ✅ Always type event handlers explicitly
onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleClick(e)}
onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
```

**Optional Props with Conditional Rendering:**
```typescript
// ✅ Use conditional spreading for optional props
{...error && { errorMessage: error }}
{...loading && { disabled: true }}
// ❌ Never: errorMessage={error || undefined}
```

**Generic Constraints for Forms:**
```typescript
// ✅ Proper generic constraints
export interface FormData extends Record<string, unknown> {
  readonly field: string;
}

// ✅ Generic validators with proper constraints
validators: {
  field: (value: unknown): ValidationResult => validate(value as string)
}
```

**Component Props with Conditional Properties:**
```typescript
// ✅ Use discriminated unions for component variants
interface BaseProps {
  readonly className?: string;
}
interface LoadingProps extends BaseProps {
  readonly loading: true;
  readonly disabled?: never;
}
interface EnabledProps extends BaseProps {
  readonly loading?: false;
  readonly disabled?: boolean;
}
type ComponentProps = LoadingProps | EnabledProps;
```

**Async Function Patterns:**
```typescript
// ✅ Handle async functions in event handlers
const handleSubmit = useCallback((e: React.FormEvent) => {
  e.preventDefault();
  void onSubmit(); // Use void operator for fire-and-forget
}, [onSubmit]);

// ✅ For awaited async functions
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await onSubmit();
  } catch (error) {
    console.error(error);
  }
}, [onSubmit]);
```

**Form State Patterns:**
```typescript
// ✅ Proper form state management
interface FormField<T> {
  readonly value: T;
  readonly error?: string;
  readonly touched: boolean;
}

// ✅ Generic form validators
type FormValidators<T extends Record<string, unknown>> = {
  readonly [K in keyof T]?: (value: T[K]) => ValidationResult;
};
```

**Nullish Coalescing:**
```typescript
// ✅ Use nullish coalescing for meaningful defaults
const name = user.name ?? 'Anonymous';
const config = options.config ?? defaultConfig;
// ❌ Never: user.name || 'Anonymous' (falsy values like '' get replaced)
```

#### Recommended Patterns
- ✅ Discriminated unions for state management
- ✅ Type guards and assertion functions
- ✅ Branded types for domain primitives
- ✅ Readonly modifiers for immutable data
- ✅ Generic functions with proper constraints
- ✅ Namespace organization for utility functions
- ✅ Comprehensive error types with context
- ✅ Event handlers with explicit React types
- ✅ Conditional prop spreading over undefined assignments
- ✅ `Record<string, unknown>` for generic object constraints
- ✅ Nullish coalescing over logical OR for defaults
