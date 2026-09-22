import type { Album } from 'src/bandcamp/domain/album/album';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';

const RELEASE_YEARS_KEY = '/collection-release-years';
const FETCH_BATCH_SIZE = 6;
const LOOKUP_TIMEOUT_MS = 45_000;

export async function loadCollectionReleaseYears(
  albums: Album[],
): Promise<Map<string, number>> {
  const cached = await storage
    .getByKey<Record<string, number>>(RELEASE_YEARS_KEY)
    .catch((error) => {
      console.warn('[Collection release years] Cache read failed:', error);
      return undefined;
    });
  const storedAlbums = await BandcampStorage.getAlbumsRawDataByIds(
    albums.map((album) => album.id),
  ).catch((error) => {
    console.warn('[Collection release years] Album lookup failed:', error);
    return [];
  });
  const storedYears = new Map(
    storedAlbums.map((album) => [
      album.url,
      album.metadata?.published ? yearFromDate(album.metadata.published) : null,
    ]),
  );
  const years = new Map<string, number>();
  const missing: Album[] = [];

  for (const album of albums) {
    const url = album.url.toString();
    const year =
      (album.metadata && yearFromDate(album.metadata.published)) ||
      storedYears.get(url) ||
      cached?.[url];
    if (typeof year === 'number' && Number.isFinite(year)) {
      years.set(url, year);
    } else {
      missing.push(album);
    }
  }

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
    await storage
      .set({ [RELEASE_YEARS_KEY]: { ...cached, ...fetched } })
      .catch((error) => {
        console.warn('[Collection release years] Cache write failed:', error);
      });
  }

  return years;
}

export async function clearCollectionReleaseYears(): Promise<void> {
  await storage.remove(RELEASE_YEARS_KEY).catch((error) => {
    console.warn('[Collection release years] Cache removal failed:', error);
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
