# Chrome extension development commands

# Default task
default:
    @just --list

# Install dependencies
install:
    @echo "📦 Installing dependencies..."
    cd extension && bun install

# Watch and build Chrome extension with linting and type checking
watch:
    @echo "🔄 Starting development mode with linting and type checking..."
    cd extension && bun run watch

# Build Chrome extension for production with full validation
build:
    @echo "🔨 Building Chrome extension with full validation..."
    cd extension && bun run build

# Clean build directory
clean:
    @echo "🧹 Cleaning extension/dist directory..."
    cd extension && bun run clean

# Full development build
dev: clean watch

# Full production build  
prod: clean build
    @echo "🚀 Production build complete!"

# Format code
format:
    @echo "💅 Formatting code..."
    cd extension && bun run format

# Check formatting without fixing
format-check:
    @echo "🔍 Checking code formatting..."
    cd extension && bun run format:check

# Run linter
lint:
    @echo "🔍 Running linter..."
    cd extension && bun run lint

# Check linting without fixing
lint-check:
    @echo "🔍 Checking linting..."
    cd extension && bun run lint:check

# Run TypeScript type checking
typecheck:
    @echo "🔍 Running TypeScript type checking..."
    cd extension && bun run typecheck

# Run all checks (linting, formatting, type checking)
check: lint-check format-check typecheck
    @echo "✅ All checks passed!"

