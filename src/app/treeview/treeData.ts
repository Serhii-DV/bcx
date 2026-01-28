import type { TreeItem } from '$lib/components/bcx';

export class TreeData {
  treeItems: TreeItem[];

  constructor(treeItems: TreeItem[] = []) {
    this.treeItems = treeItems;
  }

  add(item: TreeItem) {
    this.treeItems.push(item);
    this.treeItems = generateTreeHierarchy(this.treeItems);
  }

  get items(): TreeItem[] {
    return this.treeItems;
  }

  get visibleItems(): TreeItem[] {
    return getVisibleItems(this.treeItems);
  }

  get firstVisible(): TreeItem | undefined {
    return this.visibleItems[0];
  }

  get lastVisible(): TreeItem | undefined {
    return this.visibleItems[this.visibleItems.length - 1];
  }

  getVisibleItemIndexByPath(path: string): number {
    return this.visibleItems.findIndex((item) => item.path === path);
  }
}

function generateTreeHierarchy(
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
function getVisibleItems(
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
