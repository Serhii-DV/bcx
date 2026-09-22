import type { Album } from 'src/bandcamp/domain/album/album';
import type { RawAlbumData } from 'src/bandcamp/domain/album/compressor';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import { items } from '../TreeItemBuilder';
import { deferDescendants, generateTreeHierarchy } from '../utils';
import {
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_DISC,
  ICON_MIC,
} from '../utils/icon';
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';
import {
  loadKnownReleaseYears,
  loadReleaseYears,
  type ReleaseYearSource,
} from './releaseYears';

export interface ReleaseCatalog {
  albums: RawAlbumData[];
  addedAt?: Array<string | null>;
  addedYearSource?: ReleaseYearSource;
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
    albums.map((album, index) => [album, catalog.addedAt?.[index]]),
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

  const yearSource: ReleaseYearSource | undefined = catalog.groupByYear
    ? 'band'
    : catalog.addedYearSource;
  if (yearSource && albums.length > 0) {
    const createReleaseYears = (years: Map<string, number>): TreeItem => {
      const missingCount = albums.filter(
        (album) => !years.has(album.url.toString()),
      ).length;
      const root = createYearsRoot(
        'Release years',
        albums,
        (album) => years.get(album.url.toString()),
        createReleaseItem,
        true,
      );
      if (!root) throw new Error('Release year groups are missing.');
      if (yearSource === 'band') {
        root.children = root.children?.map((group) =>
          group.label?.startsWith('Unknown year')
            ? group
            : { ...group, query: group.label },
        );
      }
      const groupCount = root.children?.length ?? 0;
      if (missingCount > 0) {
        root.children?.push({
          label: `Find release years for ${missingCount} release${missingCount === 1 ? '' : 's'}`,
          image: ICON_CALENDAR,
          pathKey: 'find-release-years',
          includeInFilterSuggestions: false,
          onClick: async (context) => {
            const { parent, showFeedback } = context;
            if (!parent || parent.isLoadingChildren) return;
            parent.isLoadingChildren = true;
            showFeedback?.('Finding release years…', 0);
            try {
              const knownYears = await loadKnownReleaseYears(
                albums,
                yearSource,
              );
              const foundYears = await loadReleaseYears(albums, yearSource, {
                initialYears: knownYears,
              });
              const updated = createReleaseYears(foundYears);
              parent.children = generateTreeHierarchy(
                deferDescendants(updated.children ?? []),
                (parent.level ?? 0) + 1,
                parent.path ?? '',
              );
              parent.childrenCount = updated.childrenCount;
              context.focusPath = parent.children[0]?.path;
              showFeedback?.('Release years updated');
            } catch (error) {
              console.error('[Release years] Lookup failed:', error);
              showFeedback?.('Could not find release years');
            } finally {
              parent.isLoadingChildren = false;
            }
          },
        });
      }
      return {
        ...root,
        childrenCount: groupCount,
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
        const knownYears = await loadKnownReleaseYears(albums, yearSource);
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
    const aboutIndex = restoredChildren.findIndex(
      (child) => child.label === 'About' || child.label?.startsWith('About '),
    );
    if (yearsIndex > aboutIndex && aboutIndex >= 0) {
      const [years] = restoredChildren.splice(yearsIndex, 1);
      restoredChildren.splice(aboutIndex, 0, years);
    }
  }
  return { ...item, children: restoredChildren };
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
