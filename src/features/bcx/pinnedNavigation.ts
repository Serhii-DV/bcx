import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { Storage } from 'src/core/storage';
import { Url } from 'src/core/url';

export const PINNED_NAVIGATION_KEY = '/ui/pinned-navigation';
export type PinnedPageKind = 'band' | 'release' | 'track';
export interface PinnedPage {
  id: string;
  kind: PinnedPageKind;
  url: string;
  title: string;
  artistName?: string;
  entityId?: number;
  image?: string;
}
export interface PinnedNavigation {
  version: 1;
  items: PinnedPage[];
}
export type PinCommand =
  | { action: 'pin'; page: PinnedPage }
  | { action: 'unpin'; page: PinnedPage }
  | { action: 'move'; id: string; direction: 'up' | 'down' }
  | {
      action: 'reorder';
      id: string;
      targetId: string;
      position: 'before' | 'after';
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function pinnedPageDestination(
  value: string,
): { kind: PinnedPageKind; url: string } | undefined {
  try {
    const url = Url.create(value);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !/^[a-z0-9-]+\.bandcamp\.com$/.test(url.hostname) ||
      url.hostname === 'www.bandcamp.com' ||
      url.username ||
      url.password ||
      url.port
    )
      return undefined;
    url.protocol = 'https:';
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const kind = /^\/album\/[^/]+$/.test(path)
      ? 'release'
      : /^\/track\/[^/]+$/.test(path)
        ? 'track'
        : ['/', '/music', '/artists'].includes(path)
          ? 'band'
          : undefined;
    if (!kind) return undefined;
    url.pathname = path;
    const canonical =
      kind === 'band'
        ? BandcampUrlFactory.createBandUrl(url)
        : BandcampUrlFactory.create(url);
    return { kind, url: canonical.toString() };
  } catch {
    return undefined;
  }
}

export function createPinnedPage(
  url: string,
  title: string,
  artistName?: string,
  entityId?: number,
  image?: string,
): PinnedPage | undefined {
  const destination = pinnedPageDestination(url);
  if (!destination || !title.trim()) return undefined;
  const validId =
    Number.isSafeInteger(entityId) && (entityId ?? 0) > 0
      ? entityId
      : undefined;
  const validImage = pinnedPageImage(image);
  return {
    ...destination,
    id: `${destination.kind}:${validId ?? destination.url}`,
    title: title.trim(),
    ...(artistName?.trim() ? { artistName: artistName.trim() } : {}),
    ...(validId ? { entityId: validId } : {}),
    ...(validImage ? { image: validImage } : {}),
  };
}

export function pinnedPageImage(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function samePinnedPage(a: PinnedPage, b: PinnedPage): boolean {
  return (
    a.kind === b.kind &&
    (a.id === b.id ||
      a.url === b.url ||
      (a.entityId !== undefined && a.entityId === b.entityId))
  );
}

function parsePage(value: unknown): PinnedPage {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.url !== 'string' ||
    typeof value.title !== 'string' ||
    (value.artistName !== undefined && typeof value.artistName !== 'string') ||
    (value.image !== undefined &&
      (typeof value.image !== 'string' || !pinnedPageImage(value.image))) ||
    (value.entityId !== undefined &&
      (typeof value.entityId !== 'number' ||
        !Number.isSafeInteger(value.entityId) ||
        value.entityId <= 0))
  )
    throw new Error('Invalid saved pin. Saved navigation has been preserved.');
  const page = createPinnedPage(
    value.url,
    value.title,
    value.artistName,
    value.entityId,
    value.image,
  );
  if (
    !page ||
    page.kind !== value.kind ||
    !value.id.startsWith(`${page.kind}:`)
  )
    throw new Error('Invalid saved pin. Saved navigation has been preserved.');
  const identity = value.id.slice(page.kind.length + 1);
  const urlIdentity = pinnedPageDestination(identity);
  if (
    identity !== String(page.entityId ?? '') &&
    !(urlIdentity?.kind === page.kind && urlIdentity.url === identity)
  )
    throw new Error(
      'Invalid pin identity. Saved navigation has been preserved.',
    );
  // Keep the original navigation identity when a URL pin gains an entity ID.
  return { ...page, id: value.id };
}

export function parsePinnedNavigation(value: unknown): PinnedNavigation {
  if (value === undefined) return { version: 1, items: [] };
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.items))
    throw new Error(
      'Unsupported or invalid pinned navigation. Saved navigation has been preserved.',
    );
  const items = value.items.map(parsePage);
  if (
    items.some((page, index) =>
      items.slice(0, index).some((other) => samePinnedPage(page, other)),
    )
  )
    throw new Error(
      'Duplicate saved pins. Saved navigation has been preserved.',
    );
  return { version: 1, items };
}

export async function readPinnedNavigation(): Promise<PinnedNavigation> {
  const storage = new Storage(chrome.storage.local);
  return parsePinnedNavigation(await storage.getByKey(PINNED_NAVIGATION_KEY));
}

// This queue lives only in the background worker. Every command reads durable
// state, including the first command after the worker restarts.
let writeQueue: Promise<unknown> = Promise.resolve();
export function updatePinnedNavigation(command: unknown): Promise<void> {
  const operation = writeQueue.then(() => applyCommand(command));
  writeQueue = operation.catch(() => {});
  return operation;
}

async function resolveIdentity(page: PinnedPage): Promise<PinnedPage> {
  if (page.entityId) return page;
  const storage = new Storage(chrome.storage.local);
  const key = await storage.getByKey<unknown>(Url.create(page.url).uuid);
  const prefix = { band: '/b/', release: '/a/', track: '/t/' }[page.kind];
  if (typeof key !== 'string' || !key.startsWith(prefix)) return page;
  const entityId = Number(key.slice(prefix.length));
  return Number.isSafeInteger(entityId) && entityId > 0
    ? { ...page, entityId }
    : page;
}

async function applyCommand(value: unknown): Promise<void> {
  if (!isRecord(value)) throw new Error('Invalid pin command.');
  const document = await readPinnedNavigation();
  let items = document.items;
  if (value.action === 'pin' || value.action === 'unpin') {
    const page = await resolveIdentity(parsePage(value.page));
    // Resolve older URL-only pins too, so aliases merge once music data exists.
    const resolved = await Promise.all(items.map(resolveIdentity));
    const matches = resolved.flatMap((other, index) =>
      samePinnedPage(page, other) ? [index] : [],
    );
    if (value.action === 'unpin') {
      if (!matches.length) return;
      items = items.filter((_, index) => !matches.includes(index));
    } else if (matches.length) {
      const first = matches[0];
      items = items.flatMap((other, index) =>
        index === first
          ? [{ ...other, ...page, id: other.id }]
          : matches.includes(index)
            ? []
            : [other],
      );
    } else {
      items = [
        ...items,
        { ...page, id: `${page.kind}:${page.entityId ?? page.url}` },
      ];
    }
  } else if (
    value.action === 'reorder' &&
    typeof value.id === 'string' &&
    typeof value.targetId === 'string' &&
    (value.position === 'before' || value.position === 'after')
  ) {
    const page = items.find((page) => page.id === value.id);
    if (!page || value.id === value.targetId) return;
    const remaining = items.filter((page) => page.id !== value.id);
    const target = remaining.findIndex((page) => page.id === value.targetId);
    // Apply relative to the latest saved list, including concurrent changes.
    if (target < 0) return;
    const index = target + (value.position === 'after' ? 1 : 0);
    remaining.splice(index, 0, page);
    if (remaining.every((page, index) => page.id === items[index].id)) return;
    items = remaining;
  } else if (
    value.action === 'move' &&
    typeof value.id === 'string' &&
    (value.direction === 'up' || value.direction === 'down')
  ) {
    const index = items.findIndex((page) => page.id === value.id);
    const next = index + (value.direction === 'up' ? -1 : 1);
    if (index < 0 || next < 0 || next >= items.length) return;
    items = [...items];
    [items[index], items[next]] = [items[next], items[index]];
  } else {
    throw new Error('Invalid pin command.');
  }
  await new Storage(chrome.storage.local).setByKey(PINNED_NAVIGATION_KEY, {
    version: 1,
    items,
  });
}
