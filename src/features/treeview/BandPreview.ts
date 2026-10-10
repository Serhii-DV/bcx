import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { Artist } from 'src/bandcamp/domain/artist/artist';
import { Artwork } from 'src/bandcamp/domain/artwork/artwork';
import { ArtworkSize } from 'src/bandcamp/domain/artwork/artworkSize';
import { Band } from 'src/bandcamp/domain/band/band';
import {
  readSavedItems,
  validateItems,
} from 'src/bandcamp/domain/fanData/library';
import type { FollowingBandItem } from 'src/bandcamp/domain/page/PageCollection';
import { urlCompressor } from 'src/bandcamp/domain/shared';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { Url } from 'src/core/url';
import { BandTreeItem } from './items/BandTreeItem';
import {
  getReleaseArtistNames,
  loadSavedReleaseLinks,
  type ReleaseInformation,
} from './ReleasePreview';
import { createBandTreeData } from './sections/BandSidePanelSection';
import type { TreeData } from './TreeData';
import type { TreeItem } from './TreeItem';
import { items, linkOpen, text } from './TreeItemBuilder';

export interface BandPreview {
  id?: number;
  following?: boolean;
  name: string;
  url: string;
  image?: string;
  location?: string;
  cached: boolean;
  biography?: string;
  tags?: string[];
  albumCount?: number;
  trackReleaseCount?: number;
  links?: { label: string; url: string }[];
}

export async function loadBandPreview(
  fallback: BandPreview,
): Promise<BandPreview> {
  if (fallback.id === undefined) return fallback;
  const [band] = await BandcampStorage.getBands([fallback.id]);
  if (!band) return fallback;
  const metadata = band.metadata;
  return {
    ...fallback,
    name: band.name,
    image: band.artwork.id > 0 ? band.artwork.mediumSizeUrl : fallback.image,
    cached: true,
    location: metadata.location || fallback.location,
    biography: metadata.biography,
    tags: metadata.keywords,
    albumCount: metadata.albums.length,
    trackReleaseCount: metadata.trackReleases.length,
    links: metadata.links.flatMap((link) => {
      const url = releaseLink(link.url);
      return url ? [{ label: link.label, url }] : [];
    }),
  };
}

export async function loadBandDetails(
  fallback: BandPreview,
): Promise<{ about: TreeItem; treeData?: TreeData }> {
  const [saved] =
    fallback.id !== undefined
      ? await BandcampStorage.getBands([fallback.id])
      : await BandcampStorage.getByUuids([
          BandcampUrlFactory.createBandUrl(Url.create(fallback.url)).uuid,
        ]);
  if (saved instanceof Band) {
    // URL lookup returns a profile; hydrate its saved releases for the catalog.
    const band =
      fallback.id !== undefined
        ? saved
        : ((await BandcampStorage.getBands([saved.id]))[0] ?? saved);
    const about = BandTreeItem.createBandAbout(band);
    return {
      about: {
        ...about,
        aboutProfile: {
          ...about.aboutProfile,
          name: band.name,
          following: fallback.following,
        },
      },
      treeData: createBandTreeData(band),
    };
  }

  return { about: createBandAboutFallback(fallback) };
}

export async function loadBandAbout(fallback: BandPreview): Promise<TreeItem> {
  return (await loadBandDetails(fallback)).about;
}

export function createBandAboutFallback(fallback: BandPreview): TreeItem {
  return {
    ...items('About', [
      ...(fallback.links?.length
        ? [
            items(
              'Links',
              fallback.links.map((link) => linkOpen(link.label, link.url)),
            ),
          ]
        : []),
      ...(!fallback.cached
        ? [
            text(
              'No saved band details yet. Open the band’s Bandcamp page to explore its catalog.',
            ),
          ]
        : []),
    ])
      .asTree()
      .build(),
    aboutProfile: {
      id: fallback.id,
      name: fallback.name,
      url: fallback.url,
      image: fallback.image,
      location: fallback.location,
      biography: fallback.biography,
      following: fallback.following,
      albumCount: fallback.albumCount,
      trackReleaseCount: fallback.trackReleaseCount,
    },
  };
}

export async function loadBandLinkProfile(
  url: Url,
): Promise<Pick<BandPreview, 'name' | 'image'> | undefined> {
  const [band] = await BandcampStorage.getByUuids([
    BandcampUrlFactory.createBandUrl(url).uuid,
  ]);
  if (!(band instanceof Band)) return undefined;
  return {
    name: band.name,
    image:
      band.artwork.id > 0
        ? (band.artwork.getUrl(ArtworkSize.SMALL) ?? undefined)
        : undefined,
  };
}

export interface BandLinkProfile {
  name: string;
  url: Url;
  image?: string;
}

export async function loadReleaseBandLinks(
  information: ReleaseInformation,
  releaseUrl?: Url,
): Promise<{
  artists: BandLinkProfile[];
  detectedArtists: BandLinkProfile[];
  publisher?: BandLinkProfile;
  parent?: BandLinkProfile;
  releases: BandLinkProfile[];
}> {
  const normalize = (name: string) => name.trim().toLowerCase();
  const artistNames = new Set(
    [information.artist, ...Artist.parse(information.artist).names].map(
      normalize,
    ),
  );
  const publisherName = normalize(information.publisher ?? '');
  const [bands, following, releaseLinks] = await Promise.all([
    BandcampStorage.getAllCompressedBandData(),
    readSavedItems<FollowingBandItem>('following-bands'),
    loadSavedReleaseLinks(information, releaseUrl),
  ]);
  // The name index keeps only one ID per name. Read band profiles directly so
  // multiple saved pages are available without hydrating their release catalogs.
  const saved: BandLinkProfile[] = bands
    .filter((band) => typeof band.n === 'string' && typeof band.u === 'string')
    .map((band) => ({
      name: band.n,
      url: BandcampUrlFactory.createBandUrl(
        Url.create(urlCompressor.decompress(band.u)),
      ),
      image:
        Number.isSafeInteger(band.a) && band.a > 0
          ? Artwork.createForBand(band.a).smallSizeUrl
          : undefined,
    }));
  validateItems('following-bands', following);
  for (const item of following) {
    saved.push({
      name: item.name,
      url: Url.create(
        BandcampUrlFactory.generateBandUrlFromSubdomain(
          item.url_hints.subdomain,
        ),
      ),
      image:
        typeof item.image_id === 'number' &&
        Number.isSafeInteger(item.image_id) &&
        item.image_id > 0
          ? Artwork.createForBand(item.image_id).smallSizeUrl
          : undefined,
    });
  }

  function bandUrl(value?: string): Url | undefined {
    const link = releaseLink(value);
    if (!link) return undefined;
    const url = Url.create(link);
    if (url.hostname === 'bandcamp.com' || url.hostname === 'www.bandcamp.com')
      return undefined;
    url.protocol = 'https:';
    return BandcampUrlFactory.createBandUrl(url);
  }
  async function profile(url: Url, name: string): Promise<BandLinkProfile> {
    const stored = saved.find((band) => band.url.hasSameHostname(url));
    return stored ?? { url, name, ...(await loadBandLinkProfile(url)) };
  }

  const distinctPublisher = !!publisherName && !artistNames.has(publisherName);
  const publisherUrl =
    bandUrl(information.publisherUrl) ??
    saved.find((band) => normalize(band.name) === publisherName)?.url ??
    (distinctPublisher ? bandUrl(releaseUrl?.toString()) : undefined);
  let publisher =
    distinctPublisher && publisherUrl
      ? await profile(publisherUrl, information.publisher ?? '')
      : undefined;
  const artists = saved.filter((band) => artistNames.has(normalize(band.name)));
  const explicitArtistUrl = bandUrl(information.artistUrl);
  const artistUrl =
    explicitArtistUrl ??
    (!distinctPublisher ? bandUrl(releaseUrl?.toString()) : undefined);
  if (
    artistUrl &&
    (!publisherUrl ||
      !distinctPublisher ||
      !artistUrl.hasSameHostname(publisherUrl))
  ) {
    const artist = await profile(artistUrl, information.artist);
    if (explicitArtistUrl || artistNames.has(normalize(artist.name))) {
      if (saved.some((band) => band.url.hasSameHostname(artist.url)))
        artists.unshift(artist);
    } else {
      // A saved hosting band may be a label when publisher metadata is absent.
      publisher ??= artist;
    }
  }
  const parentUrl = bandUrl(releaseUrl?.toString());
  const parent = parentUrl
    ? await profile(
        parentUrl,
        publisher?.url.hasSameHostname(parentUrl)
          ? publisher.name
          : artistUrl?.hasSameHostname(parentUrl) &&
              !Artist.parse(information.artist).isVariousArtists
            ? information.artist
            : parentUrl.hostname.replace(/\.bandcamp\.com$/, ''),
      )
    : undefined;
  const detectedArtistNames = new Set(
    getReleaseArtistNames(information).map(normalize),
  );
  const detectedArtists = [
    ...artists,
    ...saved.filter((band) => detectedArtistNames.has(normalize(band.name))),
  ];
  return {
    detectedArtists: detectedArtists.filter(
      (band, index) =>
        detectedArtists.findIndex((other) =>
          other.url.hasSameHostname(band.url),
        ) === index,
    ),
    artists: artists.filter(
      (band, index) =>
        artists.findIndex((other) => other.url.hasSameHostname(band.url)) ===
        index,
    ),
    publisher,
    parent,
    releases: await Promise.all(
      releaseLinks.map(async (release) => {
        const band = await profile(
          BandcampUrlFactory.createBandUrl(release.url),
          release.url.hostname.replace(/\.bandcamp\.com$/, ''),
        );
        return {
          name: band.name,
          url: release.url,
          image: band.image ?? release.image,
        };
      }),
    ),
  };
}
