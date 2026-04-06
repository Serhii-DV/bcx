# MainTreeData caching proposal

## Why cache `MainTreeData`

`MainTreeData.create(...)` builds the full side-panel tree and runs multiple async loaders (`FollowingBands`, `FollowingGenres`, `Collection`, `Wishlist`, `History`). Even when some loaders already read from storage, rebuilding the whole tree object can still be expensive and duplicated in the same tab/session.

## Recommended approach: two-level cache

Use a **memory-first + storage-backed** cache:

1. **Level 1 (in-memory, fast path)**
   - Keep a `Map<string, CacheEntry>` in the content script process.
   - Key should include:
     - `url.uuid` (or full URL)
     - `band?.id`
     - `album?.id`
     - `fan_id` from `bandcampPageData`
     - schema version (`v1`, `v2`, ...)
   - Store `{ treeDataLike, createdAt }`.

2. **Level 2 (chrome.storage.local/session, warm path)**
   - Persist **serializable tree snapshot** only (labels, hrefs, image, keywords, nested children).
   - Do not persist non-serializable fields (`onClick`, component `icon`, function handlers).
   - Rehydrate runtime-only fields when restoring from snapshot.

## Suggested key format

```text
/ui/main-tree-cache/v2/{fan_id}/{url_uuid}/{band_id || 0}/{album_id || 0}
```

This avoids collisions across users/pages and lets you invalidate by version.

## Revalidation policy

Use **stale-while-revalidate**:

- If cached entry is **fresh**: render it immediately.
- Then revalidate in background and replace if changed.

Suggested TTLs by subtree:

- `History`: 5–15 minutes (changes frequently)
- `FollowingBands` / `FollowingGenres`: 30–60 minutes
- `Collection` / `Wishlist`: 10–30 minutes
- `Band` / `Album` page metadata: 24 hours (or until page URL changes)

For a single whole-tree TTL, start with **15 minutes**.

## Hard revalidation triggers

Always bypass cache when:

1. User clicks any explicit refresh action (`Refresh Collection`, `Refresh Following Bands`, etc.).
2. `fan_id` changes (user switched account/login).
3. Extension version changes (schema mismatch).
4. URL identity changes (`url.uuid` changed).
5. Loader errors occurred on previous snapshot (mark snapshot as degraded).

## Invalidation mechanics

- Store metadata alongside snapshot:
  - `createdAt`, `expiresAt`, `schemaVersion`, `sourceVersion`
- On read:
  - reject if `schemaVersion` mismatch
  - treat as stale if `Date.now() > expiresAt`
- On write:
  - update atomically with metadata and payload

## Minimal implementation shape

```ts
interface MainTreeCacheEntry {
  key: string;
  createdAt: number;
  expiresAt: number;
  schemaVersion: number;
  payload: MainTreeSnapshot;
}
```

`MainTreeSnapshot` should be a serializable tree model (no functions/components).

## Where to integrate

A practical integration point is around `MainTreeData.create(...)` call site in `src/bandcamp/content/app.ts`:

1. Build cache key from current page + entities.
2. Try memory cache.
3. Fallback to storage cache.
4. Render cached snapshot quickly.
5. Rebuild using current loaders and replace if changed.
6. Persist updated snapshot.

