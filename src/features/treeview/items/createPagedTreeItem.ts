import type { TreeItem } from '../TreeItem';
import { items } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { ICON_CHEVRONS_DOWN } from '../utils/icon';

const LOAD_MORE_LABEL = 'Load more';

type CreatePagedTreeItemOptions<T> = {
  batchSize: number;
  errorContext: string;
  errorMessage: string;
  items: T[];
  label: string;
  createChildren: (items: T[]) => TreeItem[];
  buttons?: TreeItemButton[];
  childrenImage?: string;
  image?: string;
  parentLabel?: string;
};

export function createPagedTreeItem<T>(
  options: CreatePagedTreeItemOptions<T>,
): TreeItem {
  const treeItemBuilder = items(options.label, createChildrenPage(options, 0));

  if (options.image) {
    treeItemBuilder.withImage(options.image);
  }

  if (options.childrenImage) {
    treeItemBuilder.withChildrenImage(options.childrenImage);
  }

  if (options.buttons) {
    treeItemBuilder.withButtons(options.buttons);
  }

  return treeItemBuilder
    .apply((treeItem) => {
      treeItem.childrenCount = options.items.length;
    })
    .build();
}

function createChildrenPage<T>(
  options: CreatePagedTreeItemOptions<T>,
  offset: number,
): TreeItem[] {
  const nextOffset = offset + options.batchSize;
  const children = options.createChildren(
    options.items.slice(offset, nextOffset),
  );

  if (nextOffset < options.items.length) {
    children.push(createLoadMoreTreeItem(options, nextOffset));
  }

  return children;
}

function createLoadMoreTreeItem<T>(
  options: CreatePagedTreeItemOptions<T>,
  offset: number,
): TreeItem {
  const loadMoreTreeItem: TreeItem = {
    label: createLoadMoreLabel(offset, options.items.length),
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
        throw new Error(
          `Cannot find parent ${options.parentLabel ?? options.label} tree item.`,
        );
      }

      const loadMoreIndex = children.findIndex(
        (child) => child === item || (!!item.path && child.path === item.path),
      );
      const nextChildren = createChildrenPage(options, offset);

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
      console.error(options.errorContext, options.errorMessage, error);
      item.label = `${createLoadMoreLabel(offset, options.items.length)} (error)`;
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
