import type { Album } from 'src/bandcamp/domain/album/album';
import { getReleaseMetadataFromAlbum } from 'src/bandcamp/domain/album/helper';
import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { TrackTime } from 'src/bandcamp/domain/track/time';
import type { Track } from 'src/bandcamp/domain/track/track';
import { TreeData } from './TreeData';

export interface ReleaseInformation {
  title: string;
  artist: string;
  artistUrl?: string;
  publisher?: string;
  publisherUrl?: string;
  date?: string;
  releaseType?: string;
  price?: string;
  collectionStatus: string[];
  tags: string[];
  tracks: {
    title: string;
    position: number;
    url?: string;
    duration?: string;
  }[];
  duration?: string;
  description?: string;
  credits?: string;
}

export class ReleasePreview extends TreeData {
  constructor(
    tree: TreeData,
    public readonly information: ReleaseInformation,
  ) {
    super(tree.items, tree.layout);
  }
}

export function createReleaseInformation(album: Album): ReleaseInformation {
  const metadata = album.metadata;
  const notes = metadata?.release;
  const parsed = getReleaseMetadataFromAlbum(album);
  const tracks = [...album.tracks].sort((a, b) => a.position - b.position);
  const seconds = tracks.reduce(
    (sum, track) =>
      sum +
      (track.time
        ? track.time.hours * 3600 + track.time.minutes * 60 + track.time.seconds
        : 0),
    0,
  );
  const hasTotal =
    tracks.length > 0 &&
    tracks.every((track) => track.time) &&
    Number.isFinite(seconds);
  const price = metadata?.price;
  const amount = notes?.minimumPrice ?? price?.amount;
  const hasPrice =
    notes?.priceAvailable !== false &&
    price &&
    amount !== undefined &&
    Number.isFinite(amount) &&
    amount >= 0;
  return {
    title: album.title,
    artist: album.artist.toString(),
    artistUrl: releaseLink(notes?.artistUrl),
    publisher: metadata?.publisher || undefined,
    publisherUrl: releaseLink(notes?.publisherUrl),
    date:
      metadata && Number.isFinite(metadata.published.getTime())
        ? metadata.publishedDate
        : undefined,
    releaseType: parsed.releaseType ?? notes?.releaseType,
    price: hasPrice
      ? `${notes?.minimumPrice !== undefined ? 'From ' : ''}${amount} ${price.currency}`
      : undefined,
    collectionStatus: [],
    tags: [...new Set(metadata?.keywords ?? [])],
    tracks: tracks.map((track) => ({
      title: track.title,
      position: track.position,
      url: releaseLink(track.url?.toString()),
      duration: track.time?.toReadableString(),
    })),
    duration: hasTotal
      ? new TrackTime(
          Math.floor(seconds / 3600),
          Math.floor(seconds / 60) % 60,
          seconds % 60,
        ).toReadableString()
      : undefined,
    description: notes?.description,
    credits: notes?.credits,
  };
}

export function createTrackInformation(track: Track): ReleaseInformation {
  const metadata = track.metadata;
  const price = metadata?.price;
  const artistUrl = track.url
    ? `${track.url.protocol}//${track.url.hostname}/`
    : undefined;

  return {
    title: track.title,
    artist: track.artist.toString(),
    artistUrl,
    publisher: metadata?.publisher || undefined,
    date:
      metadata && Number.isFinite(metadata.published.getTime())
        ? metadata.publishedDate
        : undefined,
    releaseType: 'Track',
    price:
      price && Number.isFinite(price.amount) && price.amount >= 0
        ? `${price.amount} ${price.currency}`
        : undefined,
    collectionStatus: [],
    tags: [...new Set(metadata?.keywords ?? [])],
    tracks: [],
    duration: track.time?.toReadableString(),
  };
}

// These are saved-list matches, not a claim that an absent release is unowned.
export function releaseCollectionStatus(
  album: Album,
  collection: unknown,
  wishlist: unknown,
): string[] {
  function contains(items: unknown): boolean {
    return (
      Array.isArray(items) &&
      items.some((item: unknown) => {
        if (!item || typeof item !== 'object') return false;
        if ('item_url' in item && item.item_url === album.url.toString())
          return true;
        return (
          'tralbum_type' in item &&
          item.tralbum_type === 'a' &&
          'album_id' in item &&
          album.id > 0 &&
          item.album_id === album.id
        );
      })
    );
  }
  return [
    contains(collection) ? 'In collection' : '',
    contains(wishlist) ? 'Wishlisted' : '',
  ].filter(Boolean);
}
