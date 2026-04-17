import type { TreeData } from 'src/app/treeview/TreeData';
import type { TreeItem, TreeItemClickContext } from 'src/app/treeview/TreeItem';
import {
  generateTreeHierarchy,
  hydrateTreeItemChildren,
  isNode,
} from 'src/app/treeview/utils';
import { tick } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';

export interface VisibleTreeData {
  paths: Set<string>;
  childCounts: Map<string, number>;
}

export interface ActivateTreeItemOptions {
  item?: TreeItem | null;
  event?: MouseEvent | KeyboardEvent;
  treeData: TreeData;
  focusTreeItem: (item?: TreeItem | null) => void;
  findItemByPath: (path?: string | null) => TreeItem | null;
  findParentByPath: (path?: string | null) => TreeItem | null;
  refreshTreeRendering: () => void;
  logLabel: string;
}

export interface ExpandTreeNodeOptions {
  item: TreeItem;
  container: HTMLElement | undefined;
  focusTreeItem: (item?: TreeItem | null) => void;
  refreshTreeRendering: () => void;
}

export function createVisibleTreeData(
  visibleItems: TreeItem[] | undefined,
  sourceItems: TreeItem[] | undefined,
): VisibleTreeData {
  const paths = new Set<string>();
  const childCounts = new Map<string, number>();

  function collectPaths(items: TreeItem[] | undefined) {
    if (!items) return;
    for (const item of items) {
      if (item.path) paths.add(item.path);
      if (item.children) collectPaths(item.children);
    }
  }

  function countVisibleChildren(items: TreeItem[] | undefined) {
    if (!items) return;
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        const visibleCount = item.children.filter((child) =>
          paths.has(child.path || ''),
        ).length;
        if (item.path) {
          childCounts.set(item.path, visibleCount);
        }
        countVisibleChildren(item.children);
      }
    }
  }

  collectPaths(visibleItems);
  countVisibleChildren(sourceItems);

  return { paths, childCounts };
}

export async function activateTreeItem({
  item,
  event,
  treeData,
  focusTreeItem,
  findItemByPath,
  findParentByPath,
  refreshTreeRendering,
  logLabel,
}: ActivateTreeItemOptions) {
  if (!item) return;

  console.log(logLabel, '[handleItemClick]', item, event);

  if (item.onClick) {
    const clickContext: TreeItemClickContext = {
      element: event?.currentTarget as HTMLElement,
      item,
      parent: findParentByPath(item.path),
    };

    await item.onClick(clickContext);
    treeData.treeItems = generateTreeHierarchy(treeData.items);
    refreshTreeRendering();

    if (clickContext.focusPath) {
      await tick();
      focusTreeItem(findItemByPath(clickContext.focusPath));
    }

    return;
  }

  if (item.query) {
    musicFilterStore.setSearchQuery(item.query);
    return;
  }

  if (item.href) {
    if (event?.currentTarget instanceof HTMLAnchorElement) {
      event.preventDefault();
    }

    if (event instanceof KeyboardEvent || event instanceof MouseEvent) {
      window.open(item.href, '_self');
    }
  }
}

export function shouldIgnoreTreeKeyDown(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && /^r$/i.test(event.key);
}

export function visibleItemIndex(
  items: TreeItem[],
  path?: string | null,
): number {
  if (!path) return -1;
  return items.findIndex((item) => item.path === path);
}

export function findVisibleItem(
  items: TreeItem[],
  index: number,
): TreeItem | null {
  return index >= 0 && index < items.length ? items[index] : null;
}

export function visibleNext(
  items: TreeItem[],
  index: number,
  step: number = 1,
): TreeItem | null {
  if (index < items.length - 1) {
    const targetIndex =
      step > 1 ? Math.min(index + step, items.length - 1) : index + 1;
    return items[targetIndex];
  }

  return null;
}

export function visiblePrev(
  items: TreeItem[],
  index: number,
  step: number = 1,
): TreeItem | null {
  if (index > 0) {
    const targetIndex = step > 1 ? Math.max(index - step, 0) : index - 1;
    return items[targetIndex];
  }

  return null;
}

export function findFirstVisibleChildByPath(
  items: TreeItem[],
  path?: string | null,
): TreeItem | null {
  if (!path) return null;

  const currentIndex = visibleItemIndex(items, path);
  if (currentIndex < 0) return null;

  return (
    items
      .slice(currentIndex + 1)
      .find((item) => item.path?.startsWith(`${path}.`)) ?? null
  );
}

export function elementByPath(
  container: HTMLElement | undefined,
  path?: string,
): HTMLElement | null {
  if (!path || !container) return null;
  return container.querySelector(`[data-path="${path}"]`) as HTMLElement;
}

export function focusTreeItemElement(
  container: HTMLElement | undefined,
  item?: TreeItem | null,
) {
  if (!item || !item.path) {
    return;
  }

  const element = elementByPath(container, item.path);

  if (!element) {
    return;
  }

  if (element instanceof HTMLDetailsElement) {
    element.querySelector('summary')?.focus();
  } else {
    element.focus();
  }
}

export function collapseTreeNodeElement(
  container: HTMLElement | undefined,
  item: TreeItem,
) {
  if (!isNode(item)) {
    return;
  }

  const element = elementByPath(container, item.path);

  if (element instanceof HTMLDetailsElement) {
    item.open = false;
    element.open = false;
  }
}

export async function expandTreeNode({
  item,
  container,
  focusTreeItem,
  refreshTreeRendering,
}: ExpandTreeNodeOptions) {
  if (!isNode(item)) {
    return;
  }

  const itemToFocus = item;
  item.open = true;
  let didHydrate = false;

  if (item.loadChildren && !item.childrenLoaded) {
    item.isLoadingChildren = true;
    refreshTreeRendering();
    await waitForLoadingStatePaint(itemToFocus, focusTreeItem);
    await hydrateTreeItemChildren(item, true);
    didHydrate = true;
  }

  if (didHydrate) {
    refreshTreeRendering();
    await tick();
  }

  const element = elementByPath(container, item.path);

  if (element instanceof HTMLDetailsElement) {
    item.open = true;
    element.open = true;
  }

  focusTreeItem(itemToFocus);
}

export async function waitForLoadingStatePaint(
  itemToFocus: TreeItem,
  focusTreeItem: (item?: TreeItem | null) => void,
) {
  await tick();
  focusTreeItem(itemToFocus);
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

export function getItemVisibleChildCount(
  item: TreeItem,
  query: string,
  visibleChildCounts: Map<string, number>,
): number {
  if (item.showChildrenCount === false) {
    return 0;
  }

  const loadedChildCount = item.children?.length;
  const knownChildCount = item.childrenCount ?? loadedChildCount ?? 0;

  if (!query.trim()) {
    return knownChildCount;
  }

  return visibleChildCounts.get(item.path || '') ?? knownChildCount;
}

export function treeItemMatchesQuery(item: TreeItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return getTreeItemSearchValues(item).some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

export function filterTreeItemsFlat(
  items: TreeItem[] | undefined,
  query: string,
): TreeItem[] {
  if (!query.trim()) {
    return items || [];
  }

  const matches: TreeItem[] = [];

  function collectMatchingItems(treeItems: TreeItem[] | undefined) {
    if (!treeItems) return;

    for (const item of treeItems) {
      if (treeItemMatchesQuery(item, query)) {
        matches.push(item);
      }

      collectMatchingItems(item.children);
    }
  }

  collectMatchingItems(items);
  return matches;
}

export function getTreeItemFilterSuggestions(
  items: TreeItem[] | undefined,
): string[] {
  const suggestions = new Set<string>();

  function collectSuggestions(treeItems: TreeItem[] | undefined) {
    if (!treeItems) return;

    for (const item of treeItems) {
      getTreeItemSearchValues(item).forEach((value) => suggestions.add(value));
      collectSuggestions(item.children);
    }
  }

  collectSuggestions(items);
  return Array.from(suggestions).sort();
}

function getTreeItemSearchValues(item: TreeItem): string[] {
  return [item.label, item.query, ...(item.keywords || [])].filter(
    (value): value is string => !!value?.trim(),
  );
}
