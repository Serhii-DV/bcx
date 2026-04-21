import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { items, link, list, TreeItemBuilder } from '../TreeItemBuilder';
import {
  ICON_BANKNOTE,
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_CHEVRONS_DOWN,
  ICON_DISC,
  ICON_INFO,
  ICON_MIC,
} from '../utils/icon';

const RELEASE_BATCH_SIZE = 20;
const LOAD_MORE_LABEL = 'Load more';

export class BandTreeItem {
  static create(band: Band, url: Url): TreeItem {
    const showAlbumsWithSummary = isBandcampMusicUrl(url);
    const builder = new TreeItemBuilder(BandTreeItemFactory.create(band));
    builder.withOpen(showAlbumsWithSummary).withoutHref();

    if (band.hasReleases) {
      builder.withChildren([
        this.createArtistsTreeItem(band.metadata.albums, showAlbumsWithSummary),
        this.createReleasesTreeItem(
          band.metadata.albums,
          showAlbumsWithSummary,
        ),
        this.createBandYearsTreeItem(band, showAlbumsWithSummary),
        this.createBandAbout(band),
      ]);
    } else {
      builder.add(link('Open Band/Label Page', band.url.toString()));
    }

    return builder.build();
  }

  private static createArtistsTreeItem(
    albums: Album[],
    withAlbumSummary: boolean,
  ): TreeItem {
    return items(
      'Artists',
      AlbumTreeItemFactory.fromAlbumsByArtistReleases(albums, withAlbumSummary),
    )
      .withImage(ICON_MIC)
      .withChildrenImage(ICON_MIC)
      .build();
  }

  private static createReleasesTreeItem(
    albums: Album[],
    withAlbumSummary: boolean,
  ): TreeItem {
    return items(
      'Releases',
      this.createReleaseChildrenPage(albums, withAlbumSummary, 0),
    )
      .withImage(ICON_DISC)
      .apply((item) => {
        item.childrenCount = albums.length;
      })
      .build();
  }

  private static createReleaseChildrenPage(
    albums: Album[],
    withAlbumSummary: boolean,
    offset: number,
    limit: number = RELEASE_BATCH_SIZE,
  ): TreeItem[] {
    const nextOffset = offset + limit;
    const children = AlbumTreeItemFactory.fromAlbums(
      albums.slice(offset, nextOffset),
      withAlbumSummary,
    );

    if (nextOffset < albums.length) {
      children.push(
        this.createLoadMoreReleasesTreeItem(
          albums,
          withAlbumSummary,
          nextOffset,
          limit,
        ),
      );
    }

    return children;
  }

  private static createLoadMoreReleasesTreeItem(
    albums: Album[],
    withAlbumSummary: boolean,
    offset: number,
    limit: number,
  ): TreeItem {
    const loadMoreTreeItem: TreeItem = {
      label: this.createLoadMoreLabel(offset, albums.length),
      image: ICON_CHEVRONS_DOWN,
      includeInFilterSuggestions: false,
    };

    loadMoreTreeItem.onClick = async (context) => {
      const { item } = context;
      const parent = context.parent ?? context.findParentByPath?.(item.path);

      if (item.isLoadingChildren) {
        return;
      }

      item.isLoadingChildren = true;
      context.showFeedback?.('Loading...', 0);

      try {
        const children = parent?.children;

        if (!children) {
          throw new Error('Cannot find parent Releases tree item.');
        }

        const loadMoreIndex = children.findIndex(
          (child) => child === item || child.path === item.path,
        );
        const nextChildren = this.createReleaseChildrenPage(
          albums,
          withAlbumSummary,
          offset,
          limit,
        );

        if (loadMoreIndex >= 0) {
          children.splice(loadMoreIndex, 1, ...nextChildren);
          context.focusPath = parent.path
            ? `${parent.path}.${loadMoreIndex}`
            : undefined;
        } else {
          children.push(...nextChildren);
          context.focusPath = parent.path
            ? `${parent.path}.${children.length - nextChildren.length}`
            : undefined;
        }

        parent.children = children;
      } catch (error) {
        console.error(
          '[BandTreeItem.createLoadMoreReleasesTreeItem]',
          'Failed to load more releases:',
          error,
        );
        item.label = `${this.createLoadMoreLabel(offset, albums.length)} (error)`;
        context.showFeedback?.('Error loading');
      } finally {
        item.isLoadingChildren = false;
      }
    };

    return loadMoreTreeItem;
  }

  private static createLoadMoreLabel(
    loadedCount: number,
    totalCount: number,
  ): string {
    return `${LOAD_MORE_LABEL} (${loadedCount} of ${totalCount} loaded)`;
  }

  private static createBandYearsTreeItem(
    band: Band,
    withAlbumSummary: boolean,
    label: string = 'Years',
  ): TreeItem | undefined {
    const metadata = band.metadata;
    const children: TreeItem[] = metadata.years.reverse().map((year) => {
      return {
        label: String(year),
        children: AlbumTreeItemFactory.fromAlbums(
          metadata.albumsByYear(year),
          withAlbumSummary,
        ),
      };
    });

    if (children.length === 0) {
      return undefined;
    }

    return items(label, children)
      .withImage(ICON_CALENDAR)
      .withChildrenImage(ICON_CALENDAR_DAYS)
      .build();
  }

  private static createBandAbout(band: Band): TreeItem {
    return items('About ' + band.name, [
      list('Created', [band.metadata.created.toLocaleDateString()]).withImage(
        ICON_CALENDAR_DAYS,
      ),
      list('Currency', [band.metadata.currency]).withImage(ICON_BANKNOTE),
    ])
      .asTree()
      .withImage(ICON_INFO)
      .build();
  }
}
