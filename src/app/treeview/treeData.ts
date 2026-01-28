import type { TreeItem } from './treeItem';
import {
  findItemByPath,
  generateTreeHierarchy,
  getParentPath,
  getVisibleItems,
} from './utils';

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

  visibleIndex(path: string): number {
    return this.visibleItems.findIndex((item) => item.path === path);
  }

  findVisible(index: number): TreeItem | null {
    if (index >= 0 && index < this.visibleItems.length) {
      return this.visibleItems[index];
    }
    return null;
  }

  findNextVisible(index: number): TreeItem | null {
    if (index < this.visibleItems.length - 1) {
      const nextIndex = index + 1;
      return this.visibleItems[nextIndex];
    }
    return null;
  }

  findPrevVisible(index: number): TreeItem | null {
    if (index > 0) {
      const prevIndex = index - 1;
      return this.visibleItems[prevIndex];
    }
    return null;
  }

  findByPath(path?: string | null): TreeItem | null {
    if (!path) return null;
    return findItemByPath(this.visibleItems, path);
  }

  findParentByPath(path?: string | null): TreeItem | null {
    const parentPath = getParentPath(path);
    if (!parentPath) return null;
    return this.findByPath(parentPath);
  }

  findFirstChildByPath(path?: string | null): TreeItem | null {
    const nextIndex = this.visibleIndex(path ?? '') + 1;

    if (nextIndex < this.visibleItems.length) {
      return this.visibleItems[nextIndex];
    }

    return null;
  }
}
