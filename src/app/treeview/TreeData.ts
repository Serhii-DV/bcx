import type { TreeItem } from './TreeItem';
import {
  createFilteredTreeData,
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

  get visible(): TreeItem[] {
    return getVisibleItems(this.treeItems);
  }

  get visibleFirst(): TreeItem | undefined {
    return this.visible[0];
  }

  get visibleLast(): TreeItem | undefined {
    const visible = this.visible;
    return visible[visible.length - 1];
  }

  visibleIndex(path: string): number {
    return this.visible.findIndex((item) => item.path === path);
  }

  findVisible(index: number): TreeItem | null {
    const visible = this.visible;
    if (index >= 0 && index < visible.length) {
      return visible[index];
    }
    return null;
  }

  visibleNext(index: number, step: number = 1): TreeItem | null {
    const visible = this.visible;
    if (index < visible.length - 1) {
      const targetIndex =
        step > 1 ? Math.min(index + step, this.visible.length - 1) : index + 1;
      return visible[targetIndex];
    }
    return null;
  }

  visiblePrev(index: number, step: number = 1): TreeItem | null {
    if (index > 0) {
      const targetIndex = step > 1 ? Math.max(index - step, 0) : index - 1;
      return this.visible[targetIndex];
    }
    return null;
  }

  findByPath(path?: string | null): TreeItem | null {
    if (!path) return null;
    return findItemByPath(this.visible, path);
  }

  findParentByPath(path?: string | null): TreeItem | null {
    const parentPath = getParentPath(path);
    if (!parentPath) return null;
    return this.findByPath(parentPath);
  }

  findFirstChildByPath(path?: string | null): TreeItem | null {
    const visible = this.visible;
    const visibleIndex = path
      ? this.visible.findIndex((item) => item.path === path)
      : -1;
    const nextIndex = visibleIndex + 1;
    return nextIndex < visible.length ? visible[nextIndex] : null;
  }

  filter(query: string): TreeData {
    if (query.trim() === '') {
      return this;
    }

    const filteredItems = createFilteredTreeData(this.treeItems, query);
    return new TreeData(filteredItems);
  }

  get keywords(): string[] {
    const keywords = new Set<string>();

    function collectKeywords(items: TreeItem[]) {
      items.forEach((item) => {
        if (item.keywords) {
          item.keywords.forEach((keyword) => keywords.add(keyword));
        }
        if (item.children) {
          collectKeywords(item.children);
        }
      });
    }

    collectKeywords(this.treeItems);
    return Array.from(keywords).sort();
  }
}
