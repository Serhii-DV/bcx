# GitHub Copilot Global Instructions

> These rules apply to ALL interactions with this repository

## Mandatory Commands & Tools
- **Package Manager**: ONLY use `pnpm` (never npm/yarn). If unavailable, notify the user to install it.
- **TypeScript**: ONLY create .ts/.svelte files (never .js)
- **Testing**: Use `pnpm test` with RSTest framework
- **Linting**: Use `pnpm check` and `pnpm fix`

## Technology Stack - ENFORCE THESE
- **Frontend**: Svelte 5 with runes (`$state`, `$derived`, `$effect`)
- **Styling**: TailwindCSS v4 utility classes only
- **Components**: shadcn-svelte component library
- **Browser Extension**: Chrome Manifest V3 standards
- **Build Tool**: Rsbuild (configured)

## Code Standards - NON-NEGOTIABLE
1. All new files MUST be TypeScript
2. All components MUST use Svelte 5 runes syntax
3. All utility functions MUST have unit tests
4. All styling MUST use TailwindCSS classes
5. All imports MUST be absolute from `src/`

## Project Context
This is a **Bandcamp browser extension** that enhances music discovery. Any code suggestions must:
- Not break Bandcamp's existing functionality
- Follow browser extension security practices
- Avoid direct DOM manipulation unless absolutely necessary, and prefer using Svelte's reactive features for DOM updates
- Respect Content Security Policy
