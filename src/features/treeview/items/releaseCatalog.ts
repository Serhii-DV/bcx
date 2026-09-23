import type { Album } from 'src/bandcamp/domain/album/album';
import type { RawAlbumData } from 'src/bandcamp/domain/album/compressor';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { console } from 'src/utils/console';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import { items } from '../TreeItemBuilder';
import {
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_DISC,
  ICON_MIC,
} from '../utils/icon';
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';

export interface ReleaseCatalog {
  albums: RawAlbumData[];
  addedAt?: Array<string | null>;
  releaseDates?: Array<string | null>;
  addedYearSource?: 'collection' | 'wishlist';
  groupByYear?: boolean;
  paginateReleases?: boolean;
  showReleaseDate?: boolean;
}

export function withReleaseCatalog(
  item: TreeItem,
  albums: Album[],
  options: Omit<ReleaseCatalog, 'albums'> = {},
): TreeItem {
  return restoreReleaseCatalog({
    ...item,
    releaseCatalog: {
      ...options,
      albums: albums.map((album) => album.toRawData()),
    },
  });
}

// Rebuild runtime preview and pagination callbacks from the cached album data.
export function restoreReleaseCatalog(item: TreeItem): TreeItem {
  const catalog = item.releaseCatalog;
  if (!catalog) return item;
  const albums = catalog.albums.map((album) => AlbumFactory.fromRawData(album));
  const albumsByUrl = new Map(
    albums.map((album) => [album.url.toString(), album]),
  );
  const addedAtByAlbum = new Map(
    albums.map((album, index) => [album, catalog.addedAt?.[index]]),
  );
  const releaseDateByAlbum = new Map(
    albums.map((album, index) => [album, catalog.releaseDates?.[index]]),
  );
  const createReleaseItem = (album: Album): TreeItem => {
    const release = AlbumTreeItemFactory.createWithPreview(album);
    const addedAt = addedAtByAlbum.get(album);
    const published = album.metadata?.published;
    const releaseDate =
      releaseDateByAlbum.get(album) ??
      (published && Number.isFinite(published.getTime())
        ? published.toISOString()
        : undefined);
    const releasedTimestamp =
      catalog.showReleaseDate && releaseDate
        ? { label: 'Released', dateTime: releaseDate }
        : undefined;
    return {
      ...release,
      timestamp: addedAt
        ? { label: 'Added', dateTime: addedAt }
        : releasedTimestamp,
      secondaryTimestamp: addedAt ? releasedTimestamp : undefined,
    };
  };
  const artistGroups = AlbumTreeItemFactory.fromAlbumsByArtistReleases(
    albums,
  ).map((artist) => ({
    ...artist,
    includeInFilterSuggestions: true,
    children: artist.children?.map((release) => {
      const album = release.href ? albumsByUrl.get(release.href) : undefined;
      return {
        ...(album ? createReleaseItem(album) : release),
        includeInFilterSuggestions: false,
      };
    }),
  }));
  const artists = items('Artists', artistGroups)
    .withImage(ICON_MIC)
    .withChildrenImage(ICON_MIC)
    .build();
  const roots = [
    artists,
    catalog.paginateReleases === false
      ? items('Releases', albums.map(createReleaseItem))
          .withImage(ICON_DISC)
          .build()
      : createPagedReleasesTreeItem({
          albums,
          errorContext: '[Release catalog]',
          withPreview: true,
          createPreviewItem: createReleaseItem,
        }),
  ];

  if ((catalog.groupByYear || catalog.addedYearSource) && albums.length > 0) {
    const createReleaseYears = (years: Map<string, number>): TreeItem => {
      const root = createYearsRoot(
        'Release years',
        albums,
        (album) => years.get(album.url.toString()),
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
      albums.flatMap((album) => {
        const year = album.metadata?.year;
        return typeof year === 'number' && Number.isFinite(year)
          ? [[album.url.toString(), year] as const]
          : [];
      }),
    );
    const initial = createReleaseYears(immediateYears);
    if (albums.some((album) => !immediateYears.has(album.url.toString()))) {
      initial.childrenLoaded = false;
      initial.loadChildren = async () => {
        const knownYears = await loadStoredReleaseYears(albums);
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
      albums,
      (album) => {
        const addedAt = addedAtByAlbum.get(album);
        return addedAt ? new Date(addedAt).getUTCFullYear() : undefined;
      },
      createReleaseItem,
      catalog.addedYearSource === 'wishlist',
    );
    if (addedYears) roots.push(addedYears);
  }
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
  albums: Album[],
): Promise<Map<string, number>> {
  const storedAlbums = await BandcampStorage.getAlbumsRawDataByIds(
    albums.map((album) => album.id),
  ).catch((error) => {
    console.warn('[Release years] Stored album lookup failed:', error);
    return [];
  });
  const storedYears = new Map(
    storedAlbums.map((album) => [
      album.url,
      album.metadata?.published
        ? new Date(album.metadata.published).getUTCFullYear()
        : undefined,
    ]),
  );
  const years = new Map<string, number>();
  for (const album of albums) {
    const metadataYear = album.metadata?.year;
    const year =
      typeof metadataYear === 'number' && Number.isFinite(metadataYear)
        ? metadataYear
        : storedYears.get(album.url.toString());
    if (typeof year === 'number' && Number.isFinite(year)) {
      years.set(album.url.toString(), year);
    }
  }
  return years;
}

function createYearsRoot(
  label: string,
  albums: Album[],
  getYear: (album: Album) => number | undefined,
  createReleaseItem: (album: Album) => TreeItem,
  includeUnknown: boolean = false,
): TreeItem | null {
  const albumsByYear = new Map<number, Album[]>();
  const unknown: Album[] = [];
  for (const album of albums) {
    const year = getYear(album);
    if (typeof year !== 'number' || !Number.isFinite(year)) {
      unknown.push(album);
      continue;
    }
    const releases = albumsByYear.get(year) ?? [];
    releases.push(album);
    albumsByYear.set(year, releases);
  }

  const groups = [...albumsByYear.keys()]
    .sort((a, b) => b - a)
    .map((year) =>
      items(
        String(year),
        (albumsByYear.get(year) ?? []).map((album) => ({
          ...createReleaseItem(album),
          includeInFilterSuggestions: false,
        })),
      )
        .withImage(ICON_CALENDAR_DAYS)
        .apply((group) => {
          group.pathKey = `year-${year}`;
        })
        .build(),
    );
  if (includeUnknown && unknown.length > 0) {
    groups.push(
      items(
        'Unknown year',
        unknown.map((album) => ({
          ...createReleaseItem(album),
          includeInFilterSuggestions: false,
        })),
      )
        .withImage(ICON_CALENDAR_DAYS)
        .apply((group) => {
          group.pathKey = 'unknown-year';
        })
        .build(),
    );
  }
  return groups.length
    ? items(label, groups).withImage(ICON_CALENDAR).build()
    : null;
}
