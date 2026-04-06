# BCX - Bandcamp Extension

A browser extension for enhancing the Bandcamp music discovery experience with filtering and enhanced navigation capabilities.

## Tech Stack

- **Framework**: Svelte 5 with TypeScript
- **Build Tool**: Rsbuild
- **Styling**: TailwindCSS v4 + shadcn-svelte components
- **Testing**: RSTest (Jest-based)
- **Package Manager**: pnpm
- **Code Quality**: Biome (linting & formatting)

## Setup

Install the dependencies:

```bash
pnpm install
```

## Development

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
pnpm dev
```

Build the app for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

## Development Guidelines

### Code Style & Quality

- Use **TypeScript** for all new code
- Follow **Biome** configuration for linting and formatting
- Run `pnpm check` before committing
- Use `pnpm fix` to auto-fix formatting issues

### Component Architecture

- Use **Svelte 5** with the new runes syntax
- Follow **shadcn-svelte** patterns for UI components
- Store reusable components in `src/lib/components/`
- Use **TailwindCSS** for styling with utility classes

### File Structure

- `src/bandcamp/` - Core Bandcamp integration logic
- `src/lib/components/` - Reusable UI components
- `src/utils/` - Utility functions with comprehensive tests
- `src/popup/` - Extension popup interface
- `src/background.ts` - Background script functionality

### Testing

- Write tests for all utility functions
- Use **RSTest** (Jest-based) testing framework
- Run tests with `pnpm test`
- Aim for comprehensive coverage of business logic

### Browser Extension Specifics

- Follow Chrome Extension Manifest V3 standards
- Use proper content script injection patterns
- Implement proper message passing between contexts
- Respect Bandcamp's UI/UX patterns when injecting content

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!

## Architecture Notes

- Main tree caching strategy: `docs/architecture/main-tree-data-cache.md`
