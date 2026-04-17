import type { TreeItem } from './TreeItem';

export const LAZY_TREE_ITEM_CHILDREN_THRESHOLD = 500;

export function isNode(item: TreeItem): boolean {
  return (
    !!item.hasChildren ||
    !!item.loadChildren ||
    (!!item.children && item.children.length > 0)
  );
}

export function isNodeExpanded(item: TreeItem): boolean {
  return isNode(item) && !!item.open;
}

export function getParentPath(path?: string | null): string | null {
  if (!path) return null;
  const parts = path.split('.');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('.');
}

export function generateTreeHierarchy(
  items: TreeItem[],
  level: number = 0,
  parentPath: string = '',
): TreeItem[] {
  return items.map((item, index) => {
    const currentPath = parentPath ? `${parentPath}.${index}` : `${index}`;
    const enhancedItem: TreeItem = {
      ...item,
      level,
      path: currentPath,
    };

    if (item.children && item.children.length > 0) {
      enhancedItem.children = generateTreeHierarchy(
        item.children,
        level + 1,
        currentPath,
      );
    }

    return enhancedItem;
  });
}

export async function hydrateTreeItemChildren(
  item: TreeItem,
  isLoadingStarted: boolean = false,
): Promise<void> {
  if (!item.loadChildren || item.childrenLoaded) {
    return;
  }

  if (item.isLoadingChildren && !isLoadingStarted) {
    return;
  }

  if (!isLoadingStarted) {
    item.isLoadingChildren = true;
  }

  try {
    const loadedItemOrChildren = await item.loadChildren();
    const loadedItem = Array.isArray(loadedItemOrChildren)
      ? ({ children: loadedItemOrChildren } satisfies TreeItem)
      : loadedItemOrChildren;

    if (!loadedItem) {
      item.children = [];
      item.hasChildren = false;
      return;
    }

    const { path, level, open } = item;
    Object.assign(item, loadedItem, {
      path,
      level,
      open,
      childrenLoaded: true,
      isLoadingChildren: false,
      loadChildren: undefined,
    });

    item.children = generateTreeHierarchy(
      deferDescendants(loadedItem.children || []),
      (item.level || 0) + 1,
      item.path || '',
    );
    item.hasChildren = item.children.length > 0;
  } catch (error) {
    console.error(
      '[hydrateTreeItemChildren]',
      'Failed to load children:',
      error,
    );
  } finally {
    item.isLoadingChildren = false;
  }
}

export function deferDescendants(items: TreeItem[]): TreeItem[] {
  const descendantsCount = countTreeItemDescendants(items);

  if (descendantsCount <= LAZY_TREE_ITEM_CHILDREN_THRESHOLD) {
    return items;
  }

  return items.map((item) => {
    if (!item.children || item.children.length === 0) {
      const hasLazyChildren = !!item.hasChildren || !!item.loadChildren;

      return {
        ...item,
        childrenLoaded: !hasLazyChildren,
        hasChildren: hasLazyChildren,
      };
    }

    const fullItem = item;

    return {
      ...item,
      children: undefined,
      childrenLoaded: false,
      hasChildren: true,
      loadChildren: async () => fullItem,
    };
  });
}

function countTreeItemDescendants(items: TreeItem[]): number {
  return items.reduce((count, item) => {
    return count + 1 + countTreeItemDescendants(item.children || []);
  }, 0);
}

// Flatten the tree to get all visible items for navigation
export function getVisibleItems(
  items: TreeItem[],
  result: TreeItem[] = [],
): TreeItem[] {
  for (const item of items) {
    result.push(item);
    if (item.children && item.children.length > 0 && item.open) {
      getVisibleItems(item.children, result);
    }
  }
  return result;
}

// Get visible children count based on filter
export function getVisibleChildrenCount(item: TreeItem, query: string): number {
  if (!item.children || item.children.length === 0) return 0;
  if (!query.trim()) {
    return item.children.length;
  }
  return item.children.filter((child) => itemOrDescendantMatches(child, query))
    .length;
}

export function findItemByPath(
  items: TreeItem[],
  path: string,
): TreeItem | null {
  for (const item of items) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findItemByPath(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

export function hasDescendantMatchingQuery(
  item: TreeItem,
  query: string,
): boolean {
  if (isNode(item) && item.children) {
    for (const child of item.children) {
      if (child.query?.includes(query)) {
        return true;
      }
      if (hasDescendantMatchingQuery(child, query)) {
        return true;
      }
    }
  }
  return false;
}

export function updateTreeItemCounts(treeItem: TreeItem): TreeItem {
  treeItem.label = createTreeItemCountLabel(
    treeItem.label ?? '',
    treeItem.children?.length || 0,
  );

  if (treeItem.children) {
    updateTreeItemsCounts(treeItem.children);
  }

  return treeItem;
}

export function updateTreeItemsCounts(treeItems: TreeItem[]): TreeItem[] {
  treeItems.forEach(updateTreeItemCounts);
  return treeItems;
}

function createTreeItemCountLabel(label: string, count: number): string {
  return label + (count ? ` (${count})` : '');
}

// Check if an item matches the filter query (case-insensitive)
function itemMatchesFilter(item: TreeItem, query: string): boolean {
  if (!query.trim()) return true;
  const normalizedQuery = query.toLowerCase();
  const searchableValues = [
    item.label,
    item.query,
    ...(item.keywords || []),
  ].filter((value): value is string => !!value);

  return searchableValues.some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

// Check if an item or any of its descendants match the filter
function itemOrDescendantMatches(item: TreeItem, query: string): boolean {
  if (itemMatchesFilter(item, query)) {
    return true;
  }
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => itemOrDescendantMatches(child, query));
  }
  return false;
}

// Create a deep filtered copy of tree data (independent from original)
export function createFilteredTreeItems(
  items: TreeItem[],
  query: string,
): TreeItem[] {
  return items
    .filter((item) => itemOrDescendantMatches(item, query))
    .map((item) => {
      // Create a deep copy to avoid mutating original tree
      const itemCopy: TreeItem = {
        ...item,
        children: item.children
          ? createFilteredTreeItems(item.children, query)
          : undefined,
      };
      return itemCopy;
    });
}

/**
 * Generates an onClick handler that manages loading state, prevents
 * concurrent clicks, and updates the text with the loaded array length.
 * * @param fetchData - The async function that fetches an array of data.
 */
export function createLoadHandler<T>(fetchData: () => Promise<T[]>) {
  return async (element: HTMLElement) => {
    if (element.dataset.loading === 'true') {
      return;
    }

    element.textContent = 'Loading...';
    element.dataset.loading = 'true';

    try {
      const data = await fetchData();
      const { TreeItemCache } = await import('./items/TreeItemCache');
      await TreeItemCache.invalidateAll();

      // Hardcoded string format using the array's length
      element.textContent = `Loaded ${data.length} items`;
    } catch (error) {
      console.error('Failed to load data:', error);
      element.textContent = 'Error loading';
    } finally {
      element.dataset.loading = 'false';
    }
  };
}
