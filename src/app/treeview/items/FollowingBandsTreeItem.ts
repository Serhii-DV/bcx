import { Band } from 'src/bandcamp/domain/band/band';
import {
  type FollowingBandItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import { TreeItemButtonFactory } from '../buttons/factory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { item } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';
import { ICON_CHEVRONS_DOWN } from '../utils/icon';

const FOLLOWING_BANDS_KEY = '/following-bands';
const FOLLOWING_BANDS_BATCH_SIZE = 20;
const LOAD_MORE_LABEL = 'Load more';

export class FollowingBandsTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const followingBands = await loadFollowingBandsFromStorage();

    const buttons: TreeItemButton[] = [
      createFollowingBandsOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createFollowingBandsRefreshTreeItemButton());
    }

    return item('Following Bands')
      .withChildren(this.createFollowingBandsChildrenPage(followingBands, 0))
      .apply((treeItem) => {
        treeItem.childrenCount = followingBands.length;
      })
      .withButtons(buttons)
      .build();
  }

  private static createFollowingBandsChildrenPage(
    followingBands: FollowingBandItem[],
    offset: number,
    limit: number = FOLLOWING_BANDS_BATCH_SIZE,
  ): TreeItem[] {
    const nextOffset = offset + limit;
    const children = followingBands
      .slice(offset, nextOffset)
      .map((item) => this.createFollowingBandTreeItem(item));

    if (nextOffset < followingBands.length) {
      children.push(
        this.createLoadMoreFollowingBandsTreeItem(
          followingBands,
          nextOffset,
          limit,
        ),
      );
    }

    return children;
  }

  private static createFollowingBandTreeItem(
    item: FollowingBandItem,
  ): TreeItem {
    const band = Band.create(
      item.band_id,
      item.name,
      BandcampUrlFactory.generateBandUrlFromSubdomain(item.url_hints.subdomain),
      item.image_id as number,
    );

    return BandTreeItemFactory.create(band);
  }

  private static createLoadMoreFollowingBandsTreeItem(
    followingBands: FollowingBandItem[],
    offset: number,
    limit: number,
  ): TreeItem {
    const loadMoreTreeItem: TreeItem = {
      label: this.createLoadMoreLabel(offset, followingBands.length),
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
          throw new Error('Cannot find parent Following Bands tree item.');
        }

        const loadMoreIndex = children.findIndex(
          (child) => child === item || child.path === item.path,
        );
        const nextChildren = this.createFollowingBandsChildrenPage(
          followingBands,
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
          '[FollowingBandsTreeItem.createLoadMoreFollowingBandsTreeItem]',
          'Failed to load more following bands:',
          error,
        );
        item.label = `${this.createLoadMoreLabel(offset, followingBands.length)} (error)`;
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
}

function createFollowingBandsOpenTreeItemButton(
  username: string,
): TreeItemButton {
  return TreeItemButtonFactory.createExternalLink(
    'Open Following Bands',
    BandcampUrlFactory.generateFollowingBandsUrl(username),
  );
}

function createFollowingBandsRefreshTreeItemButton(): TreeItemButton {
  return TreeItemButtonFactory.createRefreshButton(
    'Refresh Following Bands',
    createLoadHandler(loadFollowingBands),
  );
}

async function loadFollowingBandsFromStorage(): Promise<FollowingBandItem[]> {
  return (await storage.getByKey(FOLLOWING_BANDS_KEY)) || [];
}

async function loadFollowingBands(): Promise<FollowingBandItem[]> {
  const pageCollection = new PageCollection();
  const followingBands = await pageCollection.loadFollowingBandsItems({
    includeSummaryFlags: false, // Following bands don't need purchase/wishlist flags
  });
  await storage.set({ [FOLLOWING_BANDS_KEY]: followingBands });

  return followingBands;
}
