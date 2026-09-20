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
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';

export interface ReleaseCatalog {
  albums: RawAlbumData[];
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
  const artistGroups = AlbumTreeItemFactory.fromAlbumsByArtistReleases(
    albums,
  ).map((artist) => ({
    ...artist,
    children: artist.children?.map((release) => {
      const album = release.href ? albumsByUrl.get(release.href) : undefined;
      return album ? AlbumTreeItemFactory.createWithPreview(album) : release;
    }),
  }));
  const artists = items('Artists', artistGroups)
    .withImage(ICON_MIC)
    .withChildrenImage(ICON_MIC)
    .build();
  const roots = [
    artists,
    catalog.paginateReleases === false
      ? items(
          'Releases',
          albums.map((album) => AlbumTreeItemFactory.createWithPreview(album)),
        )
          .withImage(ICON_DISC)
          .build()
      : createPagedReleasesTreeItem({
          albums,
          errorContext: '[Release catalog]',
          withPreview: true,
        }),
  ];

  if (catalog.groupByYear) {
    const years = [
      ...new Set(
        albums.flatMap((album) =>
          album.metadata ? [album.metadata.year] : [],
        ),
      ),
    ].sort((a, b) => b - a);
    if (years.length) {
      roots.push(
        items(
          'Years',
          years.map((year) =>
            items(
              String(year),
              albums
                .filter((album) => album.metadata?.year === year)
                .map((album) => AlbumTreeItemFactory.createWithPreview(album)),
            )
              .withImage(ICON_CALENDAR_DAYS)
              .build(),
          ),
        )
          .withImage(ICON_CALENDAR)
          .build(),
      );
    }
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
