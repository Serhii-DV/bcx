import type { Album } from 'src/bandcamp/domain/album/album';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';

export type ReleaseYearSource = 'collection' | 'wishlist' | 'band';
const FETCH_BATCH_SIZE = 6;
const LOOKUP_TIMEOUT_MS = 45_000;

export async function loadReleaseYears(
  albums: Album[],
  source: ReleaseYearSource,
  options: {
    initialYears?: Map<string, number>;
  } = {},
): Promise<Map<string, number>> {
  const years =
    options.initialYears ?? (await loadKnownReleaseYears(albums, source));
  const missing = albums.filter((album) => !years.has(album.url.toString()));
  const cacheKey = `/${source}-release-years`;
  const fetched: Record<string, number> = {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    for (let offset = 0; offset < missing.length; offset += FETCH_BATCH_SIZE) {
      if (controller.signal.aborted) break;
      await Promise.all(
        missing.slice(offset, offset + FETCH_BATCH_SIZE).map(async (album) => {
          const url = album.url.toString();
          const year = await fetchReleaseYear(url, controller.signal);
          if (year === null) return;
          years.set(url, year);
          fetched[url] = year;
        }),
      );
    }
  } finally {
    clearTimeout(timeout);
  }

  if (Object.keys(fetched).length > 0) {
    const cached =
      (await storage
        .getByKey<Record<string, number>>(cacheKey)
        .catch(() => undefined)) ?? {};
    await storage
      .set({ [cacheKey]: { ...cached, ...fetched } })
      .catch((error) => {
        console.warn(`[${source} release years] Cache write failed:`, error);
      });
  }

  return years;
}

export async function loadKnownReleaseYears(
  albums: Album[],
  source: ReleaseYearSource,
): Promise<Map<string, number>> {
  const cacheKey = `/${source}-release-years`;
  const cached = await storage
    .getByKey<Record<string, number>>(cacheKey)
    .catch((error) => {
      console.warn(`[${source} release years] Cache read failed:`, error);
      return undefined;
    });
  const storedAlbums = await BandcampStorage.getAlbumsRawDataByIds(
    albums.map((album) => album.id),
  ).catch((error) => {
    console.warn(`[${source} release years] Album lookup failed:`, error);
    return [];
  });
  const storedYears = new Map(
    storedAlbums.map((album) => [
      album.url,
      album.metadata?.published ? yearFromDate(album.metadata.published) : null,
    ]),
  );
  const years = new Map<string, number>();

  for (const album of albums) {
    const url = album.url.toString();
    const metadataYear = album.metadata?.year;
    const year =
      (typeof metadataYear === 'number' && Number.isFinite(metadataYear)
        ? metadataYear
        : null) ||
      storedYears.get(url) ||
      cached?.[url];
    if (typeof year === 'number' && Number.isFinite(year)) {
      years.set(url, year);
    }
  }

  return years;
}

export async function clearReleaseYears(
  source: ReleaseYearSource,
): Promise<void> {
  await storage.remove(`/${source}-release-years`).catch((error) => {
    console.warn(`[${source} release years] Cache removal failed:`, error);
  });
}

async function fetchReleaseYear(
  releaseUrl: string,
  signal: AbortSignal,
): Promise<number | null> {
  try {
    const url = new URL(releaseUrl);
    if (
      url.protocol !== 'https:' ||
      (url.hostname !== 'bandcamp.com' &&
        !url.hostname.endsWith('.bandcamp.com'))
    ) {
      return null;
    }
    const response = await fetch(url, {
      credentials: 'include',
      signal,
    });
    if (!response.ok) return null;
    const page = new DOMParser().parseFromString(
      await response.text(),
      'text/html',
    );
    for (const script of Array.from(
      page.querySelectorAll('script[type="application/ld+json"]'),
    )) {
      try {
        const data: unknown = JSON.parse(script.textContent ?? '');
        const entries = Array.isArray(data) ? data : [data];
        for (const entry of entries) {
          if (!entry || typeof entry !== 'object') continue;
          const schema = entry as Record<string, unknown>;
          if (
            schema['@type'] !== 'MusicAlbum' &&
            schema['@type'] !== 'MusicRecording'
          ) {
            continue;
          }
          const year = yearFromDate(schema.datePublished);
          if (year !== null) return year;
        }
      } catch {
        continue;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function yearFromDate(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getUTCFullYear();
}
