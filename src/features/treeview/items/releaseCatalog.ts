import type { Album } from 'src/bandcamp/domain/album/album';
import type { RawAlbumData } from 'src/bandcamp/domain/album/compressor';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import { items } from '../TreeItemBuilder';
import {
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_DISC,
  ICON_MIC,
} from '../utils/icon';
import { loadCollectionReleaseYears } from './collection/releaseYears';
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';

export interface ReleaseCatalog {
  albums: RawAlbumData[];
  collectionAddedAt?: Array<string | null>;
  groupByYear?: boolean;
  paginateReleases?: boolean;
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
    albums.map((album, index) => [album, catalog.collectionAddedAt?.[index]]),
  );
  const createReleaseItem = (album: Album): TreeItem => {
    const release = AlbumTreeItemFactory.createWithPreview(album);
    const addedAt = addedAtByAlbum.get(album);
    return addedAt
      ? { ...release, timestamp: { label: 'Added', dateTime: addedAt } }
      : release;
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

  if (catalog.groupByYear) {
    const years = createYearsRoot(
      'Years',
      albums,
      (album) => album.metadata?.year,
      createReleaseItem,
    );
    if (years) roots.push(years);
  }
  if (catalog.collectionAddedAt) {
    if (albums.length > 0) {
      roots.push({
        label: 'Release years',
        image: ICON_CALENDAR,
        hasChildren: true,
        loadChildren: async () => {
          const releaseYears = await loadCollectionReleaseYears(albums);
          return createYearsRoot(
            'Release years',
            albums,
            (album) => releaseYears.get(album.url.toString()),
            createReleaseItem,
            true,
          );
        },
      });
    }
    const addedYears = createYearsRoot(
      'Added years',
      albums,
      (album) => {
        const addedAt = addedAtByAlbum.get(album);
        return addedAt ? new Date(addedAt).getUTCFullYear() : undefined;
      },
      createReleaseItem,
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
  const children = (item.children ?? []).map((child) => {
    const replacement = remaining.get(child.label);
    remaining.delete(child.label);
    return replacement ?? child;
  });
  return { ...item, children: [...children, ...remaining.values()] };
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
        .build(),
    );
  }
  return groups.length
    ? items(label, groups).withImage(ICON_CALENDAR).build()
    : null;
}
