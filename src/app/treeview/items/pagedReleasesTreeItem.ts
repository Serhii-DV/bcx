import type { Album } from 'src/bandcamp/domain/album/album';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { items } from '../TreeItemBuilder';
import { ICON_CHEVRONS_DOWN, ICON_DISC } from '../utils/icon';

const RELEASE_BATCH_SIZE = 20;
const LOAD_MORE_LABEL = 'Load more';

type CreatePagedReleasesTreeItemArgs = {
  albums: Album[];
  errorContext: string;
  withAlbumSummary?: boolean;
};

export function createPagedReleasesTreeItem({
  albums,
  errorContext,
  withAlbumSummary = false,
}: CreatePagedReleasesTreeItemArgs): TreeItem {
  return items(
    'Releases',
    createReleaseChildrenPage(albums, withAlbumSummary, errorContext, 0),
  )
    .withImage(ICON_DISC)
    .apply((treeItem) => {
      treeItem.childrenCount = albums.length;
    })
    .build();
}

function createReleaseChildrenPage(
  albums: Album[],
  withAlbumSummary: boolean,
  errorContext: string,
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
      createLoadMoreReleasesTreeItem(
        albums,
        withAlbumSummary,
        errorContext,
        nextOffset,
        limit,
      ),
    );
  }

  return children;
}

function createLoadMoreReleasesTreeItem(
  albums: Album[],
  withAlbumSummary: boolean,
  errorContext: string,
  offset: number,
  limit: number,
): TreeItem {
  const loadMoreTreeItem: TreeItem = {
    label: createLoadMoreLabel(offset, albums.length),
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
      const nextChildren = createReleaseChildrenPage(
        albums,
        withAlbumSummary,
        errorContext,
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
      console.error(errorContext, 'Failed to load more releases:', error);
      item.label = `${createLoadMoreLabel(offset, albums.length)} (error)`;
      context.showFeedback?.('Error loading');
    } finally {
      item.isLoadingChildren = false;
    }
  };

  return loadMoreTreeItem;
}

function createLoadMoreLabel(loadedCount: number, totalCount: number): string {
  return `${LOAD_MORE_LABEL} (${loadedCount} of ${totalCount} loaded)`;
}
