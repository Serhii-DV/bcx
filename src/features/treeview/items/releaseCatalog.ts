import { Album } from 'src/bandcamp/domain/album/album';
import type { RawAlbumData } from 'src/bandcamp/domain/album/data';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { groupReleasesByArtist } from 'src/bandcamp/domain/album/helper';
import {
  type BandRelease,
  type BandReleaseRef,
  resolveBandReleases,
} from 'src/bandcamp/domain/band/metadata';
import type { RawPriceData } from 'src/bandcamp/domain/price';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import type { RawTrackData } from 'src/bandcamp/domain/track/data';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { Track } from 'src/bandcamp/domain/track/track';
import { console } from 'src/utils/console';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TrackTreeItemFactory } from '../factories/TrackTreeItemFactory';
import { formatReleasePrice, getReleasePrice } from '../releasePrice';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import { items } from '../TreeItemBuilder';
import {
  ICON_BANKNOTE,
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_DISC,
  ICON_MIC,
} from '../utils/icon';
import { createPagedTreeItem } from './createPagedTreeItem';
import { RELEASE_BATCH_SIZE } from './pagedReleasesTreeItem';

export interface ReleaseCatalog {
  fanId?: number;
  albums: RawAlbumData[];
  tracks?: RawTrackData[];
  releases?: BandReleaseRef[];
  addedAt?: Array<string | null>;
  releaseDates?: Array<string | null>;
  prices?: Array<RawPriceData | null>;
  addedYearSource?: 'collection' | 'wishlist';
  groupByYear?: boolean;
  paginateReleases?: boolean;
  showReleaseDate?: boolean;
}

export function withReleaseCatalog(
  item: TreeItem,
  releases: readonly BandRelease[],
  options: Omit<ReleaseCatalog, 'albums' | 'tracks' | 'releases'> = {},
): TreeItem {
  const albums = releases.filter(
    (release): release is Album => release instanceof Album,
  );
  const tracks = releases.filter(
    (release): release is Track => release instanceof Track,
  );
  return restoreReleaseCatalog({
    ...item,
    releaseCatalog: {
      ...options,
      albums: albums.map((album) => album.toRawData()),
      tracks: tracks.length
        ? tracks.map((track) => track.toRawData())
        : undefined,
      releases: tracks.length
        ? releases.map((release) => ({
            type: release instanceof Album ? 'album' : 'track',
            id: release.id,
          }))
        : undefined,
    },
  });
}

// Rebuild runtime preview and pagination callbacks from cached release data.
export function restoreReleaseCatalog(item: TreeItem): TreeItem {
  const catalog = item.releaseCatalog;
  if (!catalog) return item;
  const savedAlbums = catalog.albums.map((album) =>
    AlbumFactory.fromRawData(album),
  );
  const tracks = (catalog.tracks ?? []).map((track) =>
    TrackFactory.fromRawData(track),
  );
  const releases: BandRelease[] = catalog.releases
    ? resolveBandReleases(catalog.releases, savedAlbums, tracks)
    : [...savedAlbums, ...tracks];
  const addedAtByRelease = new Map(
    releases.map((album, index) => [album, catalog.addedAt?.[index]]),
  );
  const releaseDateByRelease = new Map(
    releases.map((album, index) => [album, catalog.releaseDates?.[index]]),
  );
  const priceByRelease = new Map(
    releases.map((release, index) => [
      release,
      catalog.prices
        ? (catalog.prices[index] ?? undefined)
        : getReleasePrice(release.metadata),
    ]),
  );
  const createReleaseItem = (album: BandRelease): TreeItem => {
    const release =
      album instanceof Album
        ? AlbumTreeItemFactory.createWithPreview(album, catalog.fanId, {
            showReleaseDate: catalog.showReleaseDate,
            releaseDate: releaseDateByRelease.get(album) ?? undefined,
          })
        : {
            ...TrackTreeItemFactory.createWithPreview(album),
            label: album.toString(),
            image: album.artwork.id > 0 ? album.artwork.tinySizeUrl : undefined,
            keywords: album.artist.names,
          };
    const addedAt = addedAtByRelease.get(album);
    const releaseDate =
      releaseDateByRelease.get(album) ?? release.previewInformation?.date;
    const published = releaseDate ? new Date(releaseDate) : undefined;
    const releasedTimestamp =
      release.timestamp ??
      (catalog.showReleaseDate &&
      published &&
      Number.isFinite(published.getTime())
        ? { label: 'Released', dateTime: published.toISOString() }
        : undefined);
    return {
      ...release,
      price: formatReleasePrice(priceByRelease.get(album)),
      timestamp: addedAt
        ? { label: 'Added', dateTime: addedAt }
        : releasedTimestamp,
      secondaryTimestamp: addedAt ? releasedTimestamp : undefined,
    };
  };
  const artistGroups = [...groupReleasesByArtist(releases)].map(
    ([name, releases]) => ({
      ...createReleaseGroup(name, releases, createReleaseItem),
      includeInFilterSuggestions: true,
    }),
  );
  const artists = items('Artists', artistGroups)
    .withImage(ICON_MIC)
    .withChildrenImage(ICON_MIC)
    .build();
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  const compareTitles = (a: BandRelease, b: BandRelease) =>
    collator.compare(a.title, b.title) ||
    collator.compare(a.artist.toString(), b.artist.toString());
  const createReleasesRoot = (
    label: string,
    orderedReleases: () => BandRelease[],
    lazy = true,
  ): TreeItem => {
    const create = () =>
      catalog.paginateReleases === false
        ? items(label, orderedReleases().map(createReleaseItem))
            .withImage(ICON_DISC)
            .build()
        : createPagedTreeItem({
            items: orderedReleases(),
            batchSize: RELEASE_BATCH_SIZE,
            errorContext: '[Release catalog]',
            errorMessage: 'Failed to load more releases:',
            image: ICON_DISC,
            label,
            createChildren: (releases) => releases.map(createReleaseItem),
          });
    if (!lazy) return create();
    return items(label, [])
      .withImage(ICON_DISC)
      .makeLazy(async () => create())
      .apply((root) => {
        root.childrenCount = releases.length;
      })
      .build();
  };
  const roots = [
    artists,
    createReleasesRoot(
      'Releases',
      () => releases,
      catalog.paginateReleases === false &&
        releases.length > RELEASE_BATCH_SIZE,
    ),
  ];

  if ((catalog.groupByYear || catalog.addedYearSource) && releases.length > 0) {
    const createReleaseYears = (years: Map<string, number>): TreeItem => {
      const root = createYearsRoot(
        'Release years',
        releases,
        (album) => years.get(album.url?.toString() ?? ''),
        createReleaseItem,
        true,
      );
      if (!root) throw new Error('Release year groups are missing.');
      if (catalog.groupByYear) {
        root.children = root.children?.map((group) =>
          group.label?.startsWith('Unknown year')
            ? group
            : { ...group, query: group.label },
        );
      }
      return {
        ...root,
        childrenCount: root.children?.length ?? 0,
      };
    };
    const immediateYears = new Map(
      releases.flatMap((album) => {
        const year = album.metadata?.year;
        return typeof year === 'number' && Number.isFinite(year)
          ? [[album.url?.toString() ?? '', year] as const]
          : [];
      }),
    );
    const initial = createReleaseYears(immediateYears);
    if (
      releases.some((album) => !immediateYears.has(album.url?.toString() ?? ''))
    ) {
      initial.childrenLoaded = false;
      initial.loadChildren = async () => {
        const knownYears = await loadStoredReleaseYears(releases);
        return createReleaseYears(knownYears);
      };
    } else {
      initial.childrenLoaded = true;
    }
    roots.push(initial);
  }
  if (catalog.addedAt && catalog.addedYearSource) {
    const addedYears = createYearsRoot(
      'Added years',
      releases,
      (album) => {
        const addedAt = addedAtByRelease.get(album);
        return addedAt ? new Date(addedAt).getUTCFullYear() : undefined;
      },
      createReleaseItem,
      catalog.addedYearSource === 'wishlist',
    );
    if (addedYears) roots.push(addedYears);
  }
  if (releases.length > 0) {
    const priceGroups = new Map<
      string,
      { amount: number; currency: string; releases: BandRelease[] }
    >();
    const unknown: BandRelease[] = [];
    for (const release of releases) {
      const price = priceByRelease.get(release);
      const label = formatReleasePrice(price);
      if (!price || !label) {
        unknown.push(release);
        continue;
      }
      const group = priceGroups.get(label) ?? { ...price, releases: [] };
      group.releases.push(release);
      priceGroups.set(label, group);
    }
    const groups = [...priceGroups]
      .sort(([, a], [, b]) =>
        a.amount === 0 || b.amount === 0
          ? a.amount - b.amount
          : a.currency.localeCompare(b.currency) || a.amount - b.amount,
      )
      .map(([label, group]) => ({
        ...createReleaseGroup(label, group.releases, createReleaseItem),
        image: ICON_BANKNOTE,
        pathKey: `price-${encodeURIComponent(label).replaceAll('.', '%2E')}`,
      }));
    if (unknown.length > 0) {
      groups.push({
        ...createReleaseGroup('Price unknown', unknown, createReleaseItem),
        image: ICON_BANKNOTE,
        pathKey: 'price-unknown',
      });
    }
    roots.push(items('By Prices', groups).withImage(ICON_BANKNOTE).build());
  }
  roots.push(
    createReleasesRoot('Releases: Reverse', () => [...releases].reverse()),
    createReleasesRoot('Releases: Title A–Z', () =>
      [...releases].sort(compareTitles),
    ),
    createReleasesRoot('Releases: Title Z–A', () =>
      [...releases].sort((a, b) => compareTitles(b, a)),
    ),
  );
  const remaining = new Map(
    roots.map((root) => [
      root.label,
      {
        ...root,
        releasePreview: true,
        layout: TREE_ITEM_LAYOUT.BROWSER,
      },
    ]),
  );
  const children = (item.children ?? [])
    .filter((child) => !(catalog.groupByYear && child.label === 'Years'))
    .map((child) => {
      const replacement = remaining.get(child.label);
      remaining.delete(child.label);
      return replacement ?? child;
    });
  const restoredChildren = [...children, ...remaining.values()];
  if (catalog.groupByYear) {
    const yearsIndex = restoredChildren.findIndex(
      (child) => child.label === 'Release years',
    );
    const tagsIndex = restoredChildren.findIndex(
      (child) => child.label === 'Tags',
    );
    const aboutIndex = restoredChildren.findIndex(
      (child) => child.label === 'About' || child.label?.startsWith('About '),
    );
    const insertionIndex = tagsIndex >= 0 ? tagsIndex : aboutIndex;
    if (yearsIndex > insertionIndex && insertionIndex >= 0) {
      const [years] = restoredChildren.splice(yearsIndex, 1);
      restoredChildren.splice(insertionIndex, 0, years);
    }
  }
  return { ...item, children: restoredChildren };
}

async function loadStoredReleaseYears(
  releases: BandRelease[],
): Promise<Map<string, number>> {
  const [storedAlbums, storedTracks] = await Promise.all([
    BandcampStorage.getAlbumsRawDataByIds(
      releases
        .filter((release) => release instanceof Album)
        .map((album) => album.id),
    ),
    BandcampStorage.getTracksByTrackIds(
      releases
        .filter((release) => release instanceof Track)
        .map((track) => track.id),
    ).then((tracks) => tracks.map((track) => track.toRawData())),
  ]).catch((error) => {
    console.warn('[Release years] Stored album lookup failed:', error);
    return [[], []];
  });
  const storedYears = new Map(
    [...storedAlbums, ...storedTracks].map((album) => [
      album.url,
      album.metadata?.published
        ? new Date(album.metadata.published).getUTCFullYear()
        : undefined,
    ]),
  );
  const years = new Map<string, number>();
  for (const album of releases) {
    const metadataYear = album.metadata?.year;
    const year =
      typeof metadataYear === 'number' && Number.isFinite(metadataYear)
        ? metadataYear
        : storedYears.get(album.url?.toString());
    if (typeof year === 'number' && Number.isFinite(year)) {
      years.set(album.url?.toString() ?? '', year);
    }
  }
  return years;
}

function createYearsRoot(
  label: string,
  releases: BandRelease[],
  getYear: (album: BandRelease) => number | undefined,
  createReleaseItem: (album: BandRelease) => TreeItem,
  includeUnknown: boolean = false,
): TreeItem | null {
  const releasesByYear = new Map<number, BandRelease[]>();
  const unknown: BandRelease[] = [];
  for (const album of releases) {
    const year = getYear(album);
    if (typeof year !== 'number' || !Number.isFinite(year)) {
      unknown.push(album);
      continue;
    }
    const releases = releasesByYear.get(year) ?? [];
    releases.push(album);
    releasesByYear.set(year, releases);
  }

  const groups = [...releasesByYear.keys()]
    .sort((a, b) => b - a)
    .map((year) => ({
      ...createReleaseGroup(
        String(year),
        releasesByYear.get(year) ?? [],
        createReleaseItem,
      ),
      image: ICON_CALENDAR_DAYS,
      pathKey: `year-${year}`,
    }));
  if (includeUnknown && unknown.length > 0) {
    groups.push({
      ...createReleaseGroup('Unknown year', unknown, createReleaseItem),
      image: ICON_CALENDAR_DAYS,
      pathKey: 'unknown-year',
    });
  }

  return groups.length
    ? items(label, groups).withImage(ICON_CALENDAR).build()
    : null;
}

function createReleaseGroup(
  label: string,
  releases: BandRelease[],
  createReleaseItem: (album: BandRelease) => TreeItem,
): TreeItem {
  const create = () =>
    items(
      label,
      releases.map((album) => ({
        ...createReleaseItem(album),
        includeInFilterSuggestions: false,
      })),
    ).build();
  if (releases.length <= RELEASE_BATCH_SIZE) return create();
  return items(label, [])
    .makeLazy(async () => create())
    .apply((group) => {
      group.childrenCount = releases.length;
    })
    .build();
}
