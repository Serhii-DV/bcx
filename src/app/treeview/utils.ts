import { createQueryCountString } from 'src/bandcamp/domain/page/helper';
import type { TreeItem } from './treeItem';

export function isNode(item: TreeItem): boolean {
  return !!item.children && item.children.length > 0;
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

export function updateChildrenCounts(treeItems: TreeItem[]): void {
  // Update labels with counts
  treeItems.forEach((child) => {
    if (child.children) {
      child.label = createQueryCountString(child.label, child.children.length);
    }
  });
}
