# ZoteroPatch AI Reader - Justfile
# Project build and development task management

# Default task: show help
default:
    @just --list

# Show detailed help information
help:
    @echo "╔══════════════════════════════════════════════════════════════════╗"
    @echo "║         ZoteroPatch AI Reader - Command Reference               ║"
    @echo "╚══════════════════════════════════════════════════════════════════╝"
    @echo ""
    @echo "📦 SETUP & INSTALLATION"
    @echo "  just install          - Install npm dependencies"
    @echo "  just setup            - Complete setup (clean + install + build)"
    @echo "  just prepare          - Prepare project directories"
    @echo ""
    @echo "🔨 BUILD & DEVELOPMENT"
    @echo "  just dev              - Start development mode (watch & auto-rebuild)"
    @echo "  just build            - Build TypeScript to build/ directory"
    @echo "                          (for development, NOT for Zotero install)"
    @echo "  just check            - Run all checks (lint + typecheck)"
    @echo "  just lint             - Run ESLint"
    @echo "  just lint-fix         - Run ESLint with auto-fix"
    @echo "  just typecheck        - Run TypeScript type check"
    @echo "  just format           - Format code with Prettier"
    @echo ""
    @echo "🧪 TESTING"
    @echo "  just test             - Run tests"
    @echo "  just test-coverage    - Run tests with coverage report"
    @echo ""
    @echo "📦 PACKAGING FOR ZOTERO"
    @echo "  just package          - ⭐ Build + create .xpi file for Zotero"
    @echo "                          (Use this to create installable plugin!)"
    @echo "  just size             - Show build size"
    @echo ""
    @echo "  ⚠️  IMPORTANT: To install in Zotero, use 'just package' not 'just build'"
    @echo "      - 'just build'   → Creates build/ folder (for development)"
    @echo "      - 'just package' → Creates .xpi file (for Zotero installation)"
    @echo ""
    @echo "🔧 ZOTERO INTEGRATION"
    @echo "  just install-zotero   - Install to Zotero (needs ZOTERO_PLUGIN_DIR)"
    @echo "  just uninstall-zotero - Uninstall from Zotero"
    @echo "  just quick-dev        - Quick dev: build + install to Zotero"
    @echo "                          (for rapid testing, requires env var)"
    @echo ""
    @echo "📚 DOCUMENTATION"
    @echo "  just docs-dev         - Start docs dev server"
    @echo "  just docs-build       - Build documentation"
    @echo "  just docs-preview     - Preview docs build"
    @echo "  just docs-install     - Install docs dependencies"
    @echo ""
    @echo "🚀 RELEASE"
    @echo "  just pre-release      - Run all checks + build + test + package"
    @echo "  just release-patch    - Release patch version (0.1.0 -> 0.1.1)"
    @echo "  just release-minor    - Release minor version (0.1.0 -> 0.2.0)"
    @echo "  just release-major    - Release major version (0.1.0 -> 1.0.0)"
    @echo ""
    @echo "🧹 CLEANUP"
    @echo "  just clean            - Clean build artifacts"
    @echo "  just clean-all        - Clean everything (including node_modules)"
    @echo ""
    @echo "ℹ️  OTHER"
    @echo "  just status           - Show project status"
    @echo "  just log              - Show recent git log"
    @echo "  just --list           - List all available commands"
    @echo ""
    @echo "💡 QUICK START:"
    @echo "  1. First time:        just setup"
    @echo "  2. Development:       just dev"
    @echo "  3. Install to Zotero: just package  (creates .xpi file)"
    @echo "  4. Test in Zotero:    Install the .xpi in Zotero → Tools → Add-ons"
    @echo ""
    @echo "🔑 ENVIRONMENT VARIABLES:"
    @echo "  ZOTERO_PLUGIN_DIR - Path to Zotero extensions directory"
    @echo "                      (required for 'just install-zotero')"
    @echo ""

# Install dependencies
install:
    @echo "📦 Installing dependencies..."
    npm install

# Prepare project directories
prepare:
    @echo "🔧 Preparing project directories..."
    npm run prepare

# Development mode: watch files and auto-build
dev:
    @echo "👀 Starting development mode..."
    npm run build:watch

# Build production version
build:
    @echo "🚀 Building production version..."
    npm run build

# Clean build artifacts
clean:
    @echo "🧹 Cleaning build artifacts..."
    rm -rf build/ dist/ addon/ coverage/
    rm -f *.xpi *.zip

# Complete clean (including node_modules)
clean-all: clean
    @echo "🧹 Cleaning all artifacts and dependencies..."
    rm -rf node_modules/

# Run code linting
lint:
    @echo "🔍 Running ESLint..."
    npm run lint

# Run linting with auto-fix
lint-fix:
    @echo "🔧 Running ESLint with auto-fix..."
    npx eslint src --ext .ts,.tsx --fix

# Run tests
test:
    @echo "🧪 Running tests..."
    npm test

# Run tests with coverage report
test-coverage:
    @echo "📊 Running tests with coverage..."
    npm test -- --coverage

# Run TypeScript type check
typecheck:
    @echo "📝 Running TypeScript type check..."
    npx tsc --noEmit

# Complete check (lint + typecheck + test)
check: lint typecheck
    @echo "✅ All checks passed!"

# Package plugin as .xpi file
package: build
    @echo "📦 Creating .xpi package..."
    cd build && zip -r ../zoteropatch-ai-reader.xpi .
    @echo "✅ Package created: zoteropatch-ai-reader.xpi"

# Install to Zotero (requires ZOTERO_PLUGIN_DIR env var)
install-zotero: build
    @echo "📥 Installing to Zotero..."
    @if [ -z "$ZOTERO_PLUGIN_DIR" ]; then \
        echo "❌ Error: ZOTERO_PLUGIN_DIR not set"; \
        echo "Please set it to your Zotero profile extensions directory"; \
        exit 1; \
    fi
    rm -rf "$ZOTERO_PLUGIN_DIR/ai-reader@zoteropatch.com"
    cp -r build "$ZOTERO_PLUGIN_DIR/ai-reader@zoteropatch.com"
    @echo "✅ Installed to Zotero"

# Uninstall from Zotero
uninstall-zotero:
    @echo "📤 Uninstalling from Zotero..."
    @if [ -z "$ZOTERO_PLUGIN_DIR" ]; then \
        echo "❌ Error: ZOTERO_PLUGIN_DIR not set"; \
        exit 1; \
    fi
    rm -rf "$ZOTERO_PLUGIN_DIR/ai-reader@zoteropatch.com"
    @echo "✅ Uninstalled from Zotero"

# Development workflow: clean -> install -> prepare -> build
setup: clean install prepare build
    @echo "✅ Development environment setup complete!"

# Pre-release checks
pre-release: clean check build test package
    @echo "✅ Pre-release checks passed!"
    @echo "📦 Package ready: zoteropatch-ai-reader.xpi"

# Show project status
status:
    @echo "📊 Project Status"
    @echo "=================="
    @echo "Node version: $(node --version)"
    @echo "npm version: $(npm --version)"
    @if [ -d "node_modules" ]; then echo "✅ Dependencies installed"; else echo "❌ Dependencies not installed"; fi
    @if [ -d "build" ]; then echo "✅ Build exists"; else echo "❌ Build not found"; fi
    @if [ -f "zoteropatch-ai-reader.xpi" ]; then echo "✅ Package exists"; else echo "❌ Package not found"; fi

# Start docs development server
docs-dev:
    @echo "📚 Starting docs development server..."
    cd docs && npm run dev

# Build documentation
docs-build:
    @echo "📚 Building docs..."
    cd docs && npm run build

# Preview docs build
docs-preview:
    @echo "📚 Previewing docs build..."
    cd docs && npm run preview

# Install docs dependencies
docs-install:
    @echo "📦 Installing docs dependencies..."
    cd docs && npm install

# Initialize documentation
docs-init: docs-install
    @echo "✅ Docs initialized!"

# Show build size
size:
    @echo "📊 Build size analysis:"
    @if [ -f "build/index.js" ]; then \
        du -h build/index.js; \
    else \
        echo "❌ Build not found, run 'just build' first"; \
    fi

# Format code
format:
    @echo "✨ Formatting code..."
    npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"

# Show recent git log
log:
    @git log --oneline --graph --decorate -10

# Bump version (private recipe)
[private]
bump-version version:
    @echo "📝 Bumping version to {{version}}"
    npm version {{version}} --no-git-tag-version
    @echo "✅ Version updated to {{version}}"

# Release patch version (0.1.0 -> 0.1.1)
release-patch: pre-release
    @just bump-version patch
    @echo "✅ Patch release ready!"

# Release minor version (0.1.0 -> 0.2.0)
release-minor: pre-release
    @just bump-version minor
    @echo "✅ Minor release ready!"

# Release major version (0.1.0 -> 1.0.0)
release-major: pre-release
    @just bump-version major
    @echo "✅ Major release ready!"

# Quick dev cycle: build and install to Zotero
quick-dev: build install-zotero
    @echo "✅ Quick dev cycle complete!"
    @echo "💡 Restart Zotero to see changes"

# Watch and auto-install to Zotero
watch-install:
    @echo "👀 Watching for changes and auto-installing..."
    @while true; do \
        npm run build:watch & \
        BUILD_PID=$$!; \
        trap "kill $$BUILD_PID" EXIT; \
        inotifywait -e modify -r src/; \
        just install-zotero; \
    done
