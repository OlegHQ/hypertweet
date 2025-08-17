# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Development
- `bun dev` - Start development build with watch mode (Firefox by default)
- `bun dev:chrome` - Start development build with watch mode for Chrome
- `bun build` - Production build for all targets (Firefox & Chrome)
- `bun ./build.ts --watch` - Watch mode for Firefox
- `bun ./build.ts --chrome` - Single build for Chrome only
- `bun ./build.ts --all` - Build for both Firefox and Chrome

### Code Formatting
- `bun format` - Format all source files using Prettier

### Testing
- Run individual test files: `bun test src/background-app/ai/format-instructions.test.ts`
- Test files use `.test.ts` extension and are located next to source files

## Architecture Overview

This is a browser extension for X (Twitter) and LinkedIn that uses AI to generate contextual replies. The codebase is structured as a multi-entry point TypeScript application using Bun as the build tool.

### Core Components

1. **Build System** (`build.ts`)
   - Custom Bun-based build script supporting Firefox and Chrome manifests
   - Generates separate output directories: `out-firefox/` and `out-chrome/`
   - Handles manifest v3 differences between browsers automatically

2. **Background Service Worker** (`src/background-app/`)
   - Central application state management via `setupBackgroundApp()`
   - IndexedDB persistence layer through `Database` class
   - AI integration via `AIFacade` for OpenAI API calls
   - Profile and settings management services
   - Data backup/restore functionality

3. **Content Scripts** (`src/content-app/`)
   - Platform-specific scrapers for Twitter and LinkedIn
   - UI injection system with React components using Twind (Tailwind-in-JS)
   - Real-time tweet monitoring and extraction
   - Panel UI with multiple modes: simple, complex, and edit

4. **UI Components** (`src/ui/`)
   - Shared component library using Radix UI primitives
   - Router-based sidebar application for settings management
   - System prompt editor and personality configuration
   - Request logging and analytics views

### Data Layer Architecture

The application uses IndexedDB with the following stores:
- `profiles` - User profile data from LinkedIn
- `tweets` - Cached tweet data
- `xProfiles` - Twitter user profiles
- `settings` - Configuration by profile ID
- `replyTypes` - Custom reply type definitions
- `requestLog` - AI API request history

Configuration is managed through a key-value system where settings are scoped to profile IDs using the `ConfigTypeKey` enum.

### AI Integration

The AI system (`src/background-app/ai/`) includes:
- System prompt generation based on user profiles
- Context extraction from tweets and threads
- Personality-based response generation
- Token usage tracking and optimization
- Multiple model support (GPT-3.5, GPT-4, etc.)

### Extension Entry Points

1. `background.ts` - Service worker/background script
2. `content.ts` - Injected into Twitter/LinkedIn pages
3. `sidebar.tsx` - Settings panel (Firefox sidebar / Chrome side panel)
4. `debugging.tsx` - Development debugging interface

### Key Technologies

- **Runtime**: Bun (for building and running TypeScript)
- **UI Framework**: React 19 with TypeScript
- **Styling**: Twind (Tailwind CSS-in-JS) for injected content
- **State Management**: Zustand for UI state
- **UI Components**: Radix UI primitives with custom styling
- **Data Persistence**: IndexedDB via custom Database class
- **AI**: OpenAI API integration

### Development Notes

- The extension uses webextension-polyfill for cross-browser compatibility
- Manifest differences between Firefox and Chrome are handled in `build.ts`
- All UI injected into web pages uses Twind to avoid CSS conflicts
- Profile-scoped settings allow multiple user configurations
- The extension requires host permissions for x.com and linkedin.com