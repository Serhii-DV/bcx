# Agent Guidelines

These instructions apply throughout this repository. Follow more specific nested `AGENTS.md` instructions when present.

## Development Principles

- Act as a senior developer with TypeScript and JavaScript expertise; use this repository's TypeScript/Svelte stack for implementation.
- Follow SOLID, DRY, KISS, YAGNI, Clean Code, and Clean Architecture principles pragmatically.
- Prefer the simplest solution that meets the requirement. Introduce abstractions only when they clarify responsibilities or remove meaningful duplication.
- Keep functions and components focused, use descriptive names, and make dependencies explicit.
- Inspect existing implementations and callers before editing. Reuse established helpers and patterns.
- Keep changes scoped to the task. Preserve unrelated work and avoid opportunistic rewrites, dependency upgrades, or formatting changes.

## Project Overview

BCX enhances Bandcamp browsing and music discovery through a Chrome Manifest V3 extension.

- UI: Svelte 5, TypeScript, Tailwind CSS v4, and shadcn-svelte/Bits UI components.
- Build: Rsbuild with separate extension entry points.
- Package manager: pnpm; preserve `pnpm-lock.yaml` and avoid introducing other lockfiles.
- Quality tools: Biome, svelte-check, and RSTest with jsdom.

## Repository Map

- `src/bandcamp/domain/`: Bandcamp models, factories, serialization, storage, and page-related logic.
- `src/bandcamp/content/`: Content script entry points, injected UI, and page integration.
- `src/app/`: Application features, including tree views and the BCX page entry point.
- `src/sidepanel/`: Side panel UI and active-tab integration.
- `src/popup/`: Popup UI.
- `src/background.ts`: Extension background service worker.
- `src/lib/components/`: Shared UI components; `ui/` contains shadcn-style primitives.
- `src/utils/`: Shared utilities and browser API helpers.
- `src/build/`: Build-time manifest handling.
- `src/manifest.json`: Source extension manifest.
- `src/test/`: Shared test setup and mocks.
- `docs/architecture/`: Design notes; consult relevant notes before changing the documented behavior.

## Architecture and Implementation

- Keep business rules separate from Svelte rendering, DOM manipulation, and Chrome API orchestration when adding or changing logic.
- Place code in the existing feature structure. Do not introduce a parallel architecture for a small change.
- Use strict TypeScript, explicit boundary types, and type-only imports where appropriate. Prefer narrowing `unknown` over introducing `any` or unchecked assertions.
- Use Svelte 5 runes for new reactive components and follow nearby component conventions.
- Reuse shared UI primitives and Tailwind utilities. Preserve accessible labels, keyboard interaction, and focus behavior.
- Follow Biome configuration for formatting and imports, including spaces and single-quoted JavaScript/TypeScript strings.
- Clean up event listeners, observers, subscriptions, and other resources when their owner is destroyed.
- Handle expected failure paths explicitly; do not silently turn failed requests or invalid data into successful results.

## Browser Extension Constraints

- Preserve Manifest V3 compatibility and the separation between page scripts, content scripts, extension UI, and the background service worker.
- Do not assume DOM APIs are available in the service worker or that in-memory state survives worker restarts.
- Use existing messaging and storage helpers where available. Validate data crossing browser, page, network, or storage boundaries.
- Keep permissions and host access limited to what the feature requires.
- Make injected UI resilient to missing elements and repeated initialization; avoid duplicate listeners or injected elements.
- Preserve stored-data compatibility when changing keys, serializers, or compressed formats. Provide a migration or safe fallback when needed.
- Before modifying subtree caching, read `docs/architecture/main-tree-data-cache.md` and inspect the current implementation. Preserve deliberate cache keying, expiry, serialization, and invalidation behavior.
- Keep entry points in `rsbuild.config.ts` aligned with manifest generation. Edit source files rather than generated build output.

## Commands

Run commands from the repository root. Prefer targets from `makefile`; use pnpm directly when no corresponding Make target exists.

```bash
make help          # List available targets (also the default for make)
make setup         # Install dependencies and configure Git hooks
make install       # Install dependencies
make dev           # Start the development build/server
make build         # Build the production extension
make test          # Run RSTest
make test-dev      # Run tests in watch mode
make format        # Format code (writes changes)
make changeset     # Add a new changeset
```

Additional commands without Make targets:

```bash
pnpm preview       # Preview the production build locally
pnpm check         # Check linting and formatting with Biome
pnpm svelte-check  # Check Svelte and TypeScript diagnostics
pnpm fix           # Fix linting and formatting issues (writes changes)
```

`pnpm fix` and `make format` write changes. Prefer targeted formatting when unrelated files would otherwise change.

## Validation

- Add or update focused regression tests for changed behavior, particularly domain rules, serialization, caching, and error handling.
- Keep tests alongside implementation as `*.test.ts`, following existing RSTest conventions. The active setup is `rstest.config.ts` and `src/test/setup.ts`; do not infer the runner from legacy Jest files.
- Keep tests deterministic. Mock browser APIs and network boundaries, and reset shared storage or mocks between tests as needed.
- For implementation changes, run relevant tests using `make test`, `pnpm check`, and `pnpm svelte-check`. Run `make build` for changes affecting extension integration, assets, entry points, or build configuration.
- For browser-facing changes, verify the affected flow in the unpacked extension when possible. A dev-server preview alone does not validate extension APIs or content script behavior.
- Documentation-only changes need a content and diff review rather than an application test run.
- Report what changed, which checks ran, and any remaining limitations. Distinguish pre-existing failures from regressions; never claim a check passed if it was not run.
