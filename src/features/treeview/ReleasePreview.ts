import type { Album } from 'src/bandcamp/domain/album/album';
import { getReleaseMetadataFromAlbum } from 'src/bandcamp/domain/album/helper';
import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { Artist, isVariousArtists } from 'src/bandcamp/domain/artist/artist';
import { Artwork } from 'src/bandcamp/domain/artwork/artwork';
import { TrackTime } from 'src/bandcamp/domain/track/time';
import type { Track } from 'src/bandcamp/domain/track/track';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { Url } from 'src/core/url';
import { getSavedPreviewReleases } from './savedPreviewLibrary';
import { TreeData } from './TreeData';
import { TREE_ITEM_LAYOUT } from './TreeItem';
import { items, linkOpen, text } from './TreeItemBuilder';

export interface ReleaseInformation {
  title: string;
  artist: string;
  artistUrl?: string;
  publisher?: string;
  publisherUrl?: string;
  date?: string;
  modifiedDate?: string;
  releaseYear?: number;
  releaseType?: string;
  price?: string;
  collectionStatus: string[];
  tags: string[];
  tracks: {
    title: string;
    artist?: string;
    position: number;
    url?: string;
    duration?: string;
  }[];
  duration?: string;
  description?: string;
  credits?: string;
}

export function getReleaseArtistNames(
  information: ReleaseInformation,
): string[] {
  const names = new Map<string, string>();
  for (const value of [
    information.artist,
    ...information.tracks.map((track) => track.artist ?? ''),
  ]) {
    for (const name of Artist.parse(value).names) {
      const trimmed = name.trim();
      const key = trimmed.toLowerCase();
      if (key && !names.has(key)) names.set(key, trimmed);
    }
  }
  const artists = [...names.values()];
  const namedArtists = artists.filter((name) => !isVariousArtists(name));
  return namedArtists.length ? namedArtists : artists;
}

export class ReleasePreview extends TreeData {
  constructor(
    tree: TreeData,
    public readonly information: ReleaseInformation,
  ) {
    super(tree.items, tree.layout);
  }
}

export async function loadSavedReleaseLinks(
  information: ReleaseInformation,
  releaseUrl?: Url,
): Promise<{ url: Url; image?: string }[]> {
  if (!releaseUrl?.pathname.startsWith('/album/')) return [];
  const albums = await getSavedPreviewReleases(
    information.title,
    information.artist,
  );
  const links = albums.flatMap((album) => {
    const href = releaseLink(album.url);
    if (!href) return [];
    const url = BandcampUrlFactory.createAlbumUrl(Url.create(href));
    url.protocol = 'https:';
    if (
      !url.pathname.startsWith('/album/') ||
      url.toString() === releaseUrl.toString()
    )
      return [];
    return [
      {
        url,
        image:
          Number.isSafeInteger(album.artworkId) && album.artworkId > 0
            ? Artwork.createForAlbum(album.artworkId).smallSizeUrl
            : undefined,
      },
    ];
  });
  return links.filter(
    (link, index) =>
      links.findIndex(
        (other) => other.url.toString() === link.url.toString(),
      ) === index,
  );
}

export function createReleaseDetailsTree(
  baseTree: TreeData,
  information: ReleaseInformation,
): TreeData {
  const tree = new TreeData([], TREE_ITEM_LAYOUT.TREE);
  const tracks = baseTree.items.find((item) => item.label === 'Tracks');

  for (const item of [
    ...(tracks?.children?.length
      ? [{ ...tracks, open: true }]
      : information.tracks.length
        ? [
            items(
              'Tracks',
              information.tracks.map((track) => {
                const label = `${track.position}. ${track.title}${track.duration ? ` · ${track.duration}` : ''}`;
                return track.url ? linkOpen(label, track.url) : text(label);
              }),
            )
              .withOpen(true)
              .build(),
          ]
        : []),
    ...(information.description
      ? [items('About this release', [text(information.description)]).build()]
      : []),
    ...(information.credits
      ? [items('Credits', [text(information.credits)]).build()]
      : []),
  ]) {
    tree.add(item);
  }

  return tree;
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
    modifiedDate:
      metadata && Number.isFinite(metadata.modified.getTime())
        ? metadata.modifiedDate
        : undefined,
    releaseYear: Number.isFinite(parsed.releaseYear)
      ? parsed.releaseYear
      : undefined,
    releaseType: parsed.releaseType ?? notes?.releaseType ?? 'Album',
    price: hasPrice
      ? `${notes?.minimumPrice !== undefined ? 'From ' : ''}${amount} ${price.currency}`
      : undefined,
    collectionStatus: [],
    tags: [...new Set(metadata?.keywords ?? [])],
    tracks: tracks.map((track) => ({
      title: track.title,
      artist: track.artist.toString(),
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
    modifiedDate:
      metadata && Number.isFinite(metadata.modified.getTime())
        ? metadata.modifiedDate
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
