import type { CompressedData } from '../compressor';
import type { MusicAlbumSchema } from '../page/schema';

export interface ReleaseNotes extends CompressedData {
  description?: string;
  credits?: string;
  artistUrl?: string;
  publisherUrl?: string;
  releaseType?: string;
  priceAvailable?: boolean;
  minimumPrice?: number;
}

export function releaseLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function releaseNotesFromSchema(schema: MusicAlbumSchema): ReleaseNotes {
  const offer = schema.albumRelease.find(
    (release) => release.musicReleaseFormat === 'DigitalFormat',
  )?.offers;
  const minimumPrice = offer?.priceSpecification?.minPrice;
  const releaseTypes: Record<string, string> = {
    AlbumRelease: 'Album',
    EPRelease: 'EP',
    SingleRelease: 'Single',
    BroadcastRelease: 'Broadcast',
  };
  const type = schema.albumReleaseType?.split('/').pop() ?? '';
  return {
    description: schema.description?.trim() || undefined,
    credits: schema.creditText?.trim() || undefined,
    artistUrl: releaseLink(schema.byArtist['@id']),
    publisherUrl: releaseLink(schema.publisher['@id']),
    releaseType: releaseTypes[type],
    priceAvailable:
      typeof offer?.price === 'number' && Number.isFinite(offer.price),
    minimumPrice:
      typeof minimumPrice === 'number' &&
      Number.isFinite(minimumPrice) &&
      minimumPrice >= 0
        ? minimumPrice
        : undefined,
  };
}
