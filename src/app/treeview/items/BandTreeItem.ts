import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { items, link, list, TreeItemBuilder } from '../TreeItemBuilder';
import { ICON_CALENDAR, ICON_DISC, ICON_INFO, ICON_MIC } from '../utils/icon';

const RELEASE_BATCH_SIZE = 20;
const LOAD_MORE_LABEL = 'Load more';

export class BandTreeItem {
  static create(band: Band, url: Url): TreeItem {
    const showAlbumsWithKeywords = isBandcampMusicUrl(url);
    const builder = new TreeItemBuilder(BandTreeItemFactory.create(band));
    builder.withOpen(showAlbumsWithKeywords).withoutHref();

    if (band.hasReleases) {
      builder.withChildren([
        this.createArtistsTreeItem(band, showAlbumsWithKeywords),
        this.createReleasesTreeItem(band, showAlbumsWithKeywords),
        this.createBandYearsTreeItem(band, showAlbumsWithKeywords),
        this.createBandAbout(band),
      ]);
    } else {
      builder.add(link('Open Band/Label Page', band.url.toString()));
    }

    return builder.build();
  }

  private static createArtistsTreeItem(
    band: Band,
    withAlbumSummary: boolean,
  ): TreeItem {
    return items(
      'Artists',
      AlbumTreeItemFactory.fromAlbumsByArtistReleases(
        band.metadata.albums,
        withAlbumSummary,
      ),
    )
      .withImage(ICON_MIC)
      .build();
  }

  private static createReleasesTreeItem(
    band: Band,
    withAlbumSummary: boolean,
  ): TreeItem {
    return items(
      'Releases',
      this.createReleaseChildrenPage(band, withAlbumSummary, 0),
    )
      .withImage(ICON_DISC)
      .apply((item) => {
        item.childrenCount = band.metadata.albums.length;
      })
      .build();
  }

  private static createReleaseChildrenPage(
    band: Band,
    withAlbumSummary: boolean,
    offset: number,
    limit: number = RELEASE_BATCH_SIZE,
  ): TreeItem[] {
    const nextOffset = offset + limit;
    const children = AlbumTreeItemFactory.fromAlbums(
      band.metadata.albums.slice(offset, nextOffset),
      withAlbumSummary,
    );

    if (nextOffset < band.metadata.albums.length) {
      children.push(
        this.createLoadMoreReleasesTreeItem(
          band,
          withAlbumSummary,
          nextOffset,
          limit,
        ),
      );
    }

    return children;
  }

  private static createLoadMoreReleasesTreeItem(
    band: Band,
    withAlbumSummary: boolean,
    offset: number,
    limit: number,
  ): TreeItem {
    const loadMoreTreeItem: TreeItem = {
      label: this.createLoadMoreLabel(offset, band.metadata.albums.length),
      includeInFilterSuggestions: false,
    };

    loadMoreTreeItem.onClick = async (context) => {
      const { item, parent } = context;

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

        const loadMoreIndex = children.indexOf(item);
        const nextChildren = this.createReleaseChildrenPage(
          band,
          withAlbumSummary,
          offset,
          limit,
        );

        if (loadMoreIndex >= 0) {
          children.splice(loadMoreIndex, 1, ...nextChildren);
          context.focusPath = `${parent.path}.${loadMoreIndex}`;
        } else {
          children.push(...nextChildren);
          context.focusPath = `${parent.path}.${children.length - nextChildren.length}`;
        }

        parent.children = children;
      } catch (error) {
        console.error(
          '[BandTreeItem.createLoadMoreReleasesTreeItem]',
          'Failed to load more releases:',
          error,
        );
        item.label = `${this.createLoadMoreLabel(offset, band.metadata.albums.length)} (error)`;
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
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      return {
        label: String(year),
        children: AlbumTreeItemFactory.fromAlbums(
          band.metadata.albumsByYear(year),
          withAlbumSummary,
        ),
      };
    });

    if (children.length === 0) {
      return undefined;
    }

    return items(label, children).withImage(ICON_CALENDAR).build();
  }

  private static createBandAbout(band: Band): TreeItem {
    return items('About ' + band.name, [
      list('Created', [band.metadata.created.toLocaleDateString()]),
      list('Currency', [band.metadata.currency]),
    ])
      .withImage(ICON_INFO)
      .build();
  }
}
