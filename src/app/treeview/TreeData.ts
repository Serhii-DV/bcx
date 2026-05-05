import type { TreeItem } from './TreeItem';
import {
  createFilteredTreeItems,
  findItemByPath,
  generateTreeHierarchy,
  getParentPath,
  getVisibleItems,
} from './utils';

export interface TreeDataSection {
  id: string;
  label: string;
  itemPath?: string;
  defaultOpen?: boolean;
}

const FILTER_SUGGESTION_GROUP_LABELS = new Set([
  'Artists',
  'Releases',
  'Tracks',
  'Tags',
]);

export class TreeData {
  treeItems: TreeItem[];
  sections: TreeDataSection[];

  constructor(treeItems: TreeItem[] = [], sections: TreeDataSection[] = []) {
    this.treeItems = treeItems;
    this.sections = sections;
  }

  add(item: TreeItem) {
    this.treeItems.push(item);
    this.treeItems = generateTreeHierarchy(this.treeItems);
  }

  setSections(sections: TreeDataSection[]) {
    this.sections = sections;
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

    const filteredItems = createFilteredTreeItems(this.treeItems, query);
    return new TreeData(filteredItems, this.sections);
  }

  get filterSuggestions(): string[] {
    const suggestions = new Set<string>();

    function addSuggestion(value?: string) {
      const normalizedValue = value?.trim();
      if (normalizedValue) {
        suggestions.add(normalizedValue);
      }
    }

    function hasMusicContext(parentLabels: string[]) {
      return parentLabels.some((label) =>
        FILTER_SUGGESTION_GROUP_LABELS.has(label),
      );
    }

    function shouldAddItemLabel(item: TreeItem, parentLabels: string[]) {
      if (item.includeInFilterSuggestions !== undefined) {
        return item.includeInFilterSuggestions;
      }

      return !!item.href || !!item.image || hasMusicContext(parentLabels);
    }

    function collectSuggestions(
      items: TreeItem[],
      parentLabels: string[] = [],
    ) {
      items.forEach((item) => {
        if (shouldAddItemLabel(item, parentLabels)) {
          addSuggestion(item.label);
        }

        if (item.query && shouldAddItemLabel(item, parentLabels)) {
          addSuggestion(item.query);
        }

        if (shouldAddItemLabel(item, parentLabels)) {
          item.keywords?.forEach(addSuggestion);
        }

        if (item.children) {
          collectSuggestions(
            item.children,
            item.label ? [...parentLabels, item.label] : parentLabels,
          );
        }
      });
    }

    collectSuggestions(this.treeItems);
    return Array.from(suggestions).sort();
  }

  get keywords(): string[] {
    return this.filterSuggestions;
  }
}
