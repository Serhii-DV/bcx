# bcx

## Unreleased

### Minor Changes

- Added a Storage tab with measured usage, category sizes and entry counts, storage quotas, and manual refresh for local data, session memory, and Chrome sync storage. Daily history retains the latest measurement for 365 days, with size, category, and entry-count charts and 30/90/365-day filters. Current and History share a navigation bar with History filters before a right-aligned Refresh action for the active view; controls wrap on narrow panels.

- Added responsive side-panel tabs, per-tab filters, contextual page headers, and a resizable preview pane that remembers its size.
- Added band and release previews with artwork, metadata, release and collection-added dates, and direct Bandcamp links.
- Expanded release browsing with artist and year catalogs, sorting options, and full Artist/Label, Wishlist, and Following Bands lists.
- Added a shared Sync tab for fan data, preserving saved library data and exposing unavailable releases and former follows.
- Added Following Bands grouping by follow date and country, with country flags and sorting options.
- Improved History search, band/release previews, visit timestamps, and progressive loading.
- Added an unknown-year music filter, accurate per-album year counts, and compact keyword badges with accessible popovers.

### Patch Changes

- Preserved side-panel context, release order, selection, and cached previews when navigating between Bandcamp pages.
- Improved fan-data pagination, account validation, sync recovery, and refresh of related panels.
- Improved tree keyboard and double-click navigation, focus states, scrolling, and artwork fallbacks.
- Fixed relative-time component initialization and Svelte/TypeScript compatibility issues.

## 0.1.0

### Minor Changes

- c28edde: Svelte and TS is used by default for popup and content scripts
- 392300c: Added central command console
- 392300c: Album or artist search widget on the music bandcamp page
- c28edde: rsbuild integration
- c28edde: rstest initialization
