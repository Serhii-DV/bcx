<script lang="ts">
import { Eye } from '@lucide/svelte';
import { musicFilterStore } from 'src/features/bcx/stores/musicFilter';
import type { TreeData } from 'src/features/treeview/TreeData';
import {
  hasItemPreview,
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import {
  buildBreadcrumbItems,
  createFilteredTreeItems,
  findItemByPath,
  generateTreeHierarchy,
  getVisibleItems,
  hydrateTreeItemChildren,
  isNode,
  isNodeExpanded,
} from 'src/features/treeview/utils';
import {
  ICON_CHEVRON_RIGHT,
  ICON_CORNER_RIGHT_UP,
} from 'src/features/treeview/utils/icon';
import { onDestroy, onMount, type Snippet, tick, untrack } from 'svelte';
import { getItemPreviewContext } from '../stores/itemPreview';
import BcxTreeBreadcrumb from './BcxTreeBreadcrumb.svelte';
import BcxTreeBrowserFilter from './BcxTreeBrowserFilter.svelte';
import BcxTreeItem from './BcxTreeItem.svelte';
import BcxTreeRenderer from './BcxTreeRenderer.svelte';
import {
  activateTreeItem,
  collapseTreeNodeElement,
  createVisibleTreeData,
  expandTreeNode,
  filterTreeBrowserItems,
  findFirstVisibleChildByPath as findFirstVisibleChildInItemsByPath,
  findVisibleItem as findVisibleItemByIndex,
  findVisibleParentByPath as findVisibleParentInItemsByPath,
  focusTreeItemElement,
  getNavigableTreeItems,
  getTreeItemFilterSuggestions,
  visibleItemIndex as getVisibleItemIndex,
  visibleNext as getVisibleNext,
  visiblePrev as getVisiblePrev,
  shouldIgnoreTreeKeyDown,
  showTreeItemActionFeedback,
  waitForLoadingStatePaint,
} from './treeViewHelpers';

interface Props {
  treeData: TreeData;
  nativeTabNavigation?: boolean;
  initialSelectedHref?: string;
  onSelect?: (item: TreeItem | null) => void;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
  onRootLoaded?: () => void;
  filterQuery?: string | null;
  initialRootPath?: string | null;
  lockInitialRoot?: boolean;
  rootPath?: string | null;
  showBreadcrumb?: boolean;
  showFilter?: boolean;
  filterActions?: Snippet;
  itemActions?: Snippet<[TreeItem]>;
  doubleClickToExpand?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
}

const DRILL_UP_PATH = '__bcx_tree_drill_up__';

let {
  treeData,
  onSelect,
  onPreview,
  onRootLoaded,
  nativeTabNavigation = false,
  initialSelectedHref,
  filterQuery: externalFilterQuery = $bindable(null),
  initialRootPath = null,
  lockInitialRoot = false,
  rootPath = $bindable(),
  showBreadcrumb = true,
  showFilter = true,
  filterActions,
  itemActions,
  doubleClickToExpand = false,
  isLoading = false,
  loadingMessage = 'Loading',
}: Props = $props();
const sharedPreview = getItemPreviewContext();
const selectPreview = $derived(onSelect ?? sharedPreview?.select);
const showPreview = $derived(onPreview ?? sharedPreview?.show);
let isVisible = $state(false);
let treeContainer: HTMLDivElement;
let filterRef: BcxTreeBrowserFilter | undefined = $state();
let focusedPath: string | null = $state(null);
let initialSelectionApplied = $state(false);
let searchQuery = $state('');
let localFilterQuery = $state('');
let debouncedFilterQuery = $state('');
let lockedRootPath = $derived(lockInitialRoot ? initialRootPath : null);
let treeVersion = $state(0);
let storeUnsubscribe: (() => void) | null = null;
let filterDebounceTimer: number | null = null;
let filterSearchBaseline: {
  rootPath: string;
  children: TreeItem[];
  childrenCount?: number;
} | null = null;
let filterSearchLoading = $state(false);
let filterSearchError = $state('');
let activeFilterSearchQuery = $state('');
let filterSearchGeneration = 0;
const feedbackTimers = new Map<string, number>();

let currentRootItem = $derived.by(() => {
  treeVersion;
  return rootPath ? findTreeItemByPath(rootPath) : null;
});
let currentLevelItems = $derived.by(() => {
  treeVersion;
  return currentRootItem ? (currentRootItem.children ?? []) : treeData.items;
});
let itemFilterQuery = $derived(
  debouncedFilterQuery.trim().toLocaleLowerCase() ===
    activeFilterSearchQuery.toLocaleLowerCase()
    ? ''
    : debouncedFilterQuery,
);
let breadcrumbItems = $derived.by(() => {
  treeVersion;
  return rootPath ? buildBreadcrumbItems(treeData.items, rootPath) : [];
});
let browserItems = $derived.by(() => {
  treeVersion;
  return filterTreeBrowserItems(
    currentLevelItems,
    itemFilterQuery,
    currentRootItem,
  );
});
let filterSuggestions = $derived.by(() => {
  treeVersion;
  return getTreeItemFilterSuggestions(currentLevelItems);
});
let effectiveLayout = $derived(treeData.layout ?? currentRootItem?.layout);
let isTreeLayout = $derived(effectiveLayout === TREE_ITEM_LAYOUT.TREE);
let treeLayoutItems = $derived.by(() => {
  treeVersion;

  if (!isTreeLayout) {
    return currentLevelItems;
  }

  if (!itemFilterQuery.trim()) {
    return currentLevelItems;
  }

  return createFilteredTreeItems(currentLevelItems || [], itemFilterQuery);
});
let treeLayoutVisibleData = $derived.by(() => {
  treeVersion;

  if (!isTreeLayout) {
    return {
      paths: new Set<string>(),
      childCounts: new Map<string, number>(),
    };
  }

  return createVisibleTreeData(treeLayoutItems, currentLevelItems);
});
let treeLayoutVisiblePaths = $derived(treeLayoutVisibleData.paths);
let treeLayoutVisibleChildCounts = $derived(treeLayoutVisibleData.childCounts);
let effectiveFilterQuery = $derived(externalFilterQuery ?? localFilterQuery);
let emptyStateMessage = $derived.by(() => {
  if (isLoading || filterSearchLoading) {
    return loadingMessage;
  }

  if (filterSearchError) {
    return filterSearchError;
  }

  return debouncedFilterQuery.trim()
    ? 'No items match your filter'
    : 'No items here';
});

$effect(() => {
  if (isVisible && !initialSelectionApplied && initialSelectedHref) {
    const selected = browserItems.find(
      (item) => item.href === initialSelectedHref,
    );
    if (selected) {
      initialSelectionApplied = true;
      focusedPath = selected.path ?? null;
      void tick().then(() => focusTreeItem(selected));
    }
  }
});

$effect(() => {
  if (selectPreview && isVisible) {
    const selected =
      browserItems.find((item) => item.path === focusedPath) ??
      browserItems.find(hasItemPreview) ??
      null;
    if (selected) untrack(() => selectPreview?.(selected));
    if (selected && hasItemPreview(selected) && !focusedPath)
      focusedPath = selected.path ?? null;
  }
});

export function focusFirstItem() {
  focusTreeItem(getNavigableItems()[0]);
}

$effect(() => {
  if (rootPath === undefined) {
    rootPath = initialRootPath;
  }
});

$effect(() => {
  const currentQuery = effectiveFilterQuery;

  if (filterDebounceTimer !== null) {
    clearTimeout(filterDebounceTimer);
  }

  if (!currentQuery.trim()) {
    restoreFilterSearchBaseline();
    debouncedFilterQuery = '';
    filterDebounceTimer = null;
  } else {
    filterDebounceTimer = window.setTimeout(() => {
      debouncedFilterQuery = currentQuery;
      filterDebounceTimer = null;
    }, 300);
  }
});

$effect(() => {
  if (!debouncedFilterQuery.trim()) {
    focusedPath = null;
  }
});

$effect(() => {
  treeVersion;
  if (rootPath && !findTreeItemByPath(rootPath)) {
    rootPath = null;
  }
});

$effect(() => {
  treeVersion;
  if (
    currentRootItem?.loadChildren &&
    !currentRootItem.childrenLoaded &&
    !currentRootItem.isLoadingChildren
  ) {
    void loadCurrentRootItem(currentRootItem);
  }
});

onMount(() => {
  const updateVisibility = () => {
    isVisible = !treeContainer.closest('[hidden]');
  };
  const observer = new MutationObserver(updateVisibility);
  for (
    let ancestor = treeContainer.parentElement;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ['hidden'],
    });
  }
  updateVisibility();
  storeUnsubscribe = musicFilterStore.subscribe((state) => {
    console.log('[BcxTreeBrowser]', '[setSearchQuery]', 'Subscribe', state);
    if (state.searchQuery !== searchQuery) {
      searchQuery = state.searchQuery || '';
    }
  });
  return () => observer.disconnect();
});

onDestroy(() => {
  if (storeUnsubscribe) {
    storeUnsubscribe();
  }
  if (filterDebounceTimer !== null) {
    clearTimeout(filterDebounceTimer);
  }
  feedbackTimers.forEach((timer) => clearTimeout(timer));
  feedbackTimers.clear();
});

async function handleItemClick(
  item?: TreeItem | null,
  event?: MouseEvent | KeyboardEvent,
) {
  if (!item) return;

  if (item.href && event instanceof MouseEvent && event.type === 'click') {
    event.preventDefault();
    focusTreeItem(item);
    return;
  }

  if (
    item.href &&
    event instanceof KeyboardEvent &&
    event.key === 'Enter' &&
    !isNode(item)
  ) {
    item = { ...item, onClick: undefined, query: undefined };
  }

  focusedPath = item.path ?? null;
  await activateTreeItem({
    item,
    event,
    treeData,
    focusTreeItem,
    findItemByPath: findTreeItemByPath,
    findParentByPath: findParentTreeItemByPath,
    refreshTreeRendering,
    showItemFeedback,
    logLabel: '[BcxTreeBrowser]',
  });
  if (item.onClick) onRootLoaded?.();
}

function handleItemDoubleClick(item: TreeItem, event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest('.item-button'))
    return;
  if (
    doubleClickToExpand &&
    (isDrillUpItem(item) || (isNode(item) && !isTreeLayout))
  ) {
    event.preventDefault();
    event.stopPropagation();
    void handleBrowserItemClick(item, event);
    return;
  }
  if (!item.href) return;
  event.preventDefault();
  event.stopPropagation();
  void handleItemClick(
    { ...item, onClick: undefined, query: undefined },
    event,
  );
}

function getItemTitle(item: TreeItem): string | undefined {
  if (doubleClickToExpand && isDrillUpItem(item)) {
    return `${getDrillUpLabel()}\nClick to select\nDouble-click to go back`;
  }
  if (doubleClickToExpand && isNode(item) && !isTreeLayout) {
    const actionHint = `Click to select\nDouble-click to show subitems${item.href ? '\nCtrl+Enter to open artist page' : ''}`;
    return item.hint ? `${item.hint}\n${actionHint}` : actionHint;
  }
  if (!item.href) return item.hint;

  const navigationHint = 'Double-click to open the page';
  const actionHint =
    hasItemPreview(item) && selectPreview
      ? `Click to preview ${item.bandPreview ? 'band' : 'release'} details\n${navigationHint}`
      : `Click to select\n${navigationHint}`;

  return item.hint ? `${item.hint}\n${actionHint}` : actionHint;
}

function withPreviewButton(item: TreeItem): TreeItem {
  if (!showPreview || !hasItemPreview(item)) return item;
  return {
    ...item,
    buttons: [
      {
        icon: Eye,
        title: `Preview ${item.bandPreview?.name ?? item.previewInformation?.title ?? item.label ?? 'item'}`,
        onClick: (trigger) => showPreview?.(item, trigger),
      },
      ...(item.buttons ?? []),
    ],
  };
}

async function handleKeyDown(event: KeyboardEvent) {
  if (!treeContainer) return;
  if (event.target instanceof Element && event.target.closest('.item-button'))
    return;

  if (shouldIgnoreTreeKeyDown(event)) {
    return;
  }

  if (event.key === 'Tab' && nativeTabNavigation) return;
  event.preventDefault();

  const currentIndex = visibleItemIndex(focusedPath);
  const pageSize = 20;

  switch (event.key) {
    case 'ArrowDown':
      focusTreeItem(visibleNext(currentIndex));
      break;

    case 'Tab':
      focusTreeItem(
        event.shiftKey
          ? visiblePrevLoop(currentIndex)
          : visibleNextLoop(currentIndex),
      );
      break;

    case 'ArrowUp':
      if (currentIndex <= 0) {
        filterRef?.focus();
        break;
      }
      focusTreeItem(visiblePrev(currentIndex));
      break;

    case 'ArrowRight':
      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (hasItemPreview(currentItem) && !isNode(currentItem)) break;

        if (isTreeLayout && !isDrillUpItem(currentItem)) {
          if (!isNode(currentItem)) {
            await handleItemClick(currentItem, event);
            break;
          }

          if (!isNodeExpanded(currentItem)) {
            await expandCurrentTreeNode(currentItem);
          } else {
            focusTreeItem(findFirstVisibleChildByPath(currentItem.path));
          }
          break;
        }

        await handleBrowserItemClick(currentItem, event);
      }
      break;

    case 'ArrowLeft':
      if (isTreeLayout && currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isDrillUpItem(currentItem)) {
          navigateToParentLevel();
          break;
        }

        if (isNodeExpanded(currentItem)) {
          collapseCurrentTreeNode(currentItem);
          break;
        }

        focusTreeItem(
          findVisibleParentByPath(currentItem.path) || createDrillUpItem(),
        );
        break;
      }

      navigateToParentLevel();
      break;

    case 'Enter':
    case ' ':
      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isTreeLayout && !isDrillUpItem(currentItem)) {
          if (isNode(currentItem)) {
            if (isNodeExpanded(currentItem)) {
              collapseCurrentTreeNode(currentItem);
            } else {
              await expandCurrentTreeNode(currentItem);
            }
          } else {
            await handleItemClick(currentItem, event);
          }
          break;
        }

        await handleBrowserItemClick(currentItem, event);
      }
      break;

    case 'Home':
      focusTreeItem(getNavigableItems()[0]);
      break;

    case 'End':
      focusTreeItem(getNavigableItems().at(-1));
      break;

    case 'PageDown':
      focusTreeItem(visibleNext(currentIndex, pageSize));
      break;

    case 'PageUp':
      focusTreeItem(visiblePrev(currentIndex, pageSize));
      break;
  }
}

function getNavigableItems(): TreeItem[] {
  if (isTreeLayout) {
    const items = getTreeLayoutNavigableItems();
    return canNavigateToParentLevel() ? [createDrillUpItem(), ...items] : items;
  }

  return canNavigateToParentLevel()
    ? [createDrillUpItem(), ...browserItems]
    : browserItems;
}

function visibleItemIndex(path?: string | null): number {
  return getVisibleItemIndex(getNavigableItems(), path);
}

function findVisibleItem(index: number): TreeItem | null {
  return findVisibleItemByIndex(getNavigableItems(), index);
}

function findNavigableItemByPath(path?: string | null): TreeItem | null {
  if (!path) {
    return null;
  }

  return getNavigableItems().find((item) => item.path === path) || null;
}

function visibleNext(index: number, step: number = 1): TreeItem | null {
  return getVisibleNext(getNavigableItems(), index, step);
}

function visiblePrev(index: number, step: number = 1): TreeItem | null {
  return getVisiblePrev(getNavigableItems(), index, step);
}

function visibleNextLoop(index: number): TreeItem | null {
  const items = getNavigableItems();

  if (items.length === 0) {
    return null;
  }

  return index >= 0 && index < items.length - 1 ? items[index + 1] : items[0];
}

function visiblePrevLoop(index: number): TreeItem | null {
  const items = getNavigableItems();

  if (items.length === 0) {
    return null;
  }

  return index > 0 ? items[index - 1] : items[items.length - 1];
}

function getTreeLayoutNavigableItems(): TreeItem[] {
  return getNavigableTreeItems(
    getVisibleItems(currentLevelItems || []),
    itemFilterQuery,
    treeLayoutVisiblePaths,
  );
}

function findVisibleParentByPath(path?: string | null): TreeItem | null {
  return findVisibleParentInItemsByPath(getNavigableItems(), path);
}

function findFirstVisibleChildByPath(path?: string | null): TreeItem | null {
  return findFirstVisibleChildInItemsByPath(getNavigableItems(), path);
}

function focusTreeItem(item?: TreeItem | null) {
  if (!item || !item.path) {
    return;
  }

  focusedPath = item.path;
  if (isVisible) selectPreview?.(item);
  focusTreeItemElement(treeContainer, item);
}

function refreshTreeRendering() {
  treeVersion += 1;
}

function collapseCurrentTreeNode(item: TreeItem) {
  collapseTreeNodeElement(treeContainer, item);
}

function showItemFeedback(
  item: TreeItem,
  message: string,
  duration: number = 1600,
) {
  showTreeItemActionFeedback(
    treeContainer,
    item,
    message,
    feedbackTimers,
    duration,
  );
}

function findTreeItemByPath(path?: string | null): TreeItem | null {
  if (!path) return null;
  return findItemByPath(treeData.items, path);
}

function findParentTreeItemByPath(path?: string | null): TreeItem | null {
  if (!path) return null;
  const parentPath = path.split('.').slice(0, -1).join('.');
  return parentPath ? findTreeItemByPath(parentPath) : null;
}

function createDrillUpItem(): TreeItem {
  return {
    label: '..',
    actionIcon: ICON_CORNER_RIGHT_UP,
    path: DRILL_UP_PATH,
    level: currentRootItem?.level || 0,
  };
}

function getDrillUpLabel(): string {
  const parentItem = findParentTreeItemByPath(rootPath);
  return parentItem ? `Back to ${parentItem.label}` : 'Back to root';
}

function isDrillUpItem(item: TreeItem): boolean {
  return item.path === DRILL_UP_PATH;
}

function navigateToLevel(path: string | null, focusPath?: string | null) {
  applyFilterImmediately();
  rootPath = path;
  focusedPath = null;
  refreshTreeRendering();
  tick().then(() => {
    focusTreeItem(findNavigableItemByPath(focusPath) || getNavigableItems()[0]);
  });
}

function navigateToParentLevel() {
  if (!canNavigateToParentLevel()) {
    return;
  }

  const previousRootPath = rootPath;
  const parentItem = findParentTreeItemByPath(rootPath);
  navigateToLevel(parentItem?.path || null, previousRootPath);
}

function canNavigateToParentLevel(): boolean {
  return !!rootPath && rootPath !== lockedRootPath;
}

function applyFilterImmediately() {
  if (filterDebounceTimer !== null) {
    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = null;
  }

  debouncedFilterQuery = effectiveFilterQuery;
}

async function enterBrowserItem(
  item: TreeItem,
  event?: MouseEvent | KeyboardEvent,
) {
  if (!isNode(item) || !item.path) {
    await handleItemClick(item, event);
    return;
  }

  const itemToEnter = item;
  const itemPath = item.path;

  if (item.loadChildren && !item.childrenLoaded) {
    item.isLoadingChildren = true;
    refreshTreeRendering();
    await waitForLoadingStatePaint(itemToEnter, focusTreeItem);
    showItemFeedback(itemToEnter, 'Loading...', 0);
    await hydrateTreeItemChildren(item, true);
    refreshTreeRendering();
    await tick();
  }

  if (item.query) {
    await handleItemClick(item, event);
  }
  navigateToLevel(itemPath);
}

async function loadCurrentRootItem(item: TreeItem) {
  item.isLoadingChildren = true;
  refreshTreeRendering();
  await waitForLoadingStatePaint(item, focusTreeItem);
  showItemFeedback(item, 'Loading...', 0);
  let selectedHref: string | undefined;
  await hydrateTreeItemChildren(
    item,
    true,
    () => {
      if (selectedHref) {
        const selected = findDescendantByHref(
          item.children ?? [],
          selectedHref,
        );
        focusedPath = selected?.path ?? null;
        if (
          selected?.path &&
          rootPath?.startsWith(`${item.path}.`) &&
          !selected.path.startsWith(`${rootPath}.`)
        ) {
          rootPath = selected.path.slice(0, selected.path.lastIndexOf('.'));
        }
      } else if (focusedPath && !findTreeItemByPath(focusedPath)) {
        focusedPath = null;
      }
      refreshTreeRendering();
      onRootLoaded?.();
    },
    () => {
      selectedHref = focusedPath
        ? findTreeItemByPath(focusedPath)?.href
        : undefined;
    },
  );
  refreshTreeRendering();
  if (item.childrenLoaded) onRootLoaded?.();
  await tick();
}

function findDescendantByHref(
  items: TreeItem[],
  href: string,
): TreeItem | null {
  for (const item of items) {
    if (item.href === href) return item;
    const descendant = findDescendantByHref(item.children ?? [], href);
    if (descendant) return descendant;
  }
  return null;
}

async function handleBrowserItemClick(
  item: TreeItem,
  event?: MouseEvent | KeyboardEvent,
) {
  if (
    doubleClickToExpand &&
    isNode(item) &&
    event instanceof KeyboardEvent &&
    event.key === 'Enter' &&
    event.ctrlKey
  ) {
    event.preventDefault();
    if (item.href && !event.repeat) {
      try {
        await handleItemClick(
          { ...item, onClick: undefined, query: undefined },
          event,
        );
      } catch (error) {
        console.error('[BcxTreeBrowser]', 'Could not open artist page:', error);
        showItemFeedback(item, 'Could not open artist page', 3500);
      }
    }
    return;
  }

  if (
    doubleClickToExpand &&
    (isDrillUpItem(item) || isNode(item)) &&
    event instanceof MouseEvent &&
    event.type === 'click'
  ) {
    event.preventDefault();
    focusTreeItem(item);
    return;
  }

  if (isDrillUpItem(item)) {
    navigateToParentLevel();
    return;
  }

  if (isNode(item)) {
    event?.preventDefault();
    await enterBrowserItem(item, event);
    return;
  }

  await handleItemClick(item, event);
}

function handleFilterArrowDown() {
  focusTreeItem(getNavigableItems()[0]);
}

function setFilterQuery(query: string) {
  if (externalFilterQuery === null) localFilterQuery = query;
  else externalFilterQuery = query;
}

async function handleUnmatchedFilterSubmit(query: string) {
  const rootItem = currentRootItem;
  const normalizedQuery = query.trim();

  if (!rootItem?.path || !rootItem.filterSearch || !normalizedQuery) {
    return;
  }

  applyFilterImmediately();
  filterSearchBaseline ??= {
    rootPath: rootItem.path,
    children: rootItem.children ?? [],
    childrenCount: rootItem.childrenCount,
  };

  const generation = ++filterSearchGeneration;
  filterSearchLoading = true;
  filterSearchError = '';

  try {
    const result = await rootItem.filterSearch(normalizedQuery);
    if (
      generation !== filterSearchGeneration ||
      currentRootItem !== rootItem ||
      effectiveFilterQuery.trim() !== normalizedQuery
    ) {
      return;
    }

    rootItem.children = result.items;
    rootItem.childrenCount = result.total;
    activeFilterSearchQuery = normalizedQuery;
    focusedPath = null;
    treeData.treeItems = generateTreeHierarchy(treeData.items);
    refreshTreeRendering();
  } catch (error) {
    console.error('[BcxTreeBrowser]', 'History filter search failed:', error);
    if (generation === filterSearchGeneration) {
      filterSearchError = 'Could not search history';
    }
  } finally {
    if (generation === filterSearchGeneration) {
      filterSearchLoading = false;
    }
  }
}

function restoreFilterSearchBaseline() {
  if (!filterSearchBaseline) {
    return;
  }

  const rootItem = findTreeItemByPath(filterSearchBaseline.rootPath);
  if (rootItem) {
    rootItem.children = filterSearchBaseline.children;
    rootItem.childrenCount = filterSearchBaseline.childrenCount;
    treeData.treeItems = generateTreeHierarchy(treeData.items);
    refreshTreeRendering();
  }

  filterSearchGeneration += 1;
  filterSearchBaseline = null;
  filterSearchLoading = false;
  filterSearchError = '';
  activeFilterSearchQuery = '';
}

function getItemVisibleChildCount(item: TreeItem): number {
  if (item.showChildrenCount === false) {
    return 0;
  }

  return item.childrenCount ?? item.children?.length ?? 0;
}

function withBrowserChildCount(item: TreeItem): TreeItem {
  return {
    ...item,
    childrenCount: getItemVisibleChildCount(item),
  };
}

function withBrowserTreeItemState(item: TreeItem): TreeItem {
  return {
    ...withBrowserChildCount(item),
    actionIcon: ICON_CHEVRON_RIGHT,
  };
}

async function expandCurrentTreeNode(item: TreeItem) {
  await expandTreeNode({
    item,
    container: treeContainer,
    focusTreeItem,
    refreshTreeRendering,
    showItemFeedback,
  });
}

function handleTreeLayoutNodeClick(item: TreeItem, event: MouseEvent) {
  event.preventDefault();
  focusedPath = item.path ?? null;
  selectPreview?.(item);

  if (isNodeExpanded(item)) {
    collapseCurrentTreeNode(item);
    return;
  }

  expandCurrentTreeNode(item);
}
</script>

{#snippet backTreeItem(item: TreeItem)}
  <div
    role="button"
    class="tree-item bcx-browser-row"
      class:focused={focusedPath === item.path}
      data-level="{item.level}"
      data-path="{item.path}"
      tabindex={focusedPath === item.path ? 0 : -1}
      title={getItemTitle(item) || getDrillUpLabel()}
      aria-label={getDrillUpLabel()}
      onclick={(e) => handleBrowserItemClick(item, e)}
      ondblclick={(event) => handleItemDoubleClick(item, event)}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleBrowserItemClick(item, e);
      }
    }}
  >
    <BcxTreeItem item={item} />
  </div>
{/snippet}

{#snippet browserTreeItem(item: TreeItem)}
  {@const hasChildren = isNode(item)}
  {#if hasItemPreview(item) && !hasChildren}
    <div
      role="button"
      class="tree-item bcx-browser-row"
      class:focused={focusedPath === item.path}
      data-level={item.level}
      data-path={item.path}
      tabindex={focusedPath === item.path ? 0 : -1}
      title={getItemTitle(item)}
      onfocus={() => { focusedPath = item.path ?? null; selectPreview?.(item); }}
      onclick={() => focusTreeItem(item)}
      ondblclick={(event) => handleItemDoubleClick(item, event)}
      onkeydown={(event) => {
        if (event.target instanceof Element && event.target.closest('.item-button')) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          void handleItemClick(item, event);
        }
      }}
    >
      <BcxTreeItem item={withPreviewButton(withBrowserChildCount(item))} {itemActions} />
    </div>
  {:else if hasChildren}
    <div
      role="button"
      class="tree-item bcx-browser-row"
      class:focused={focusedPath === item.path}
      data-level="{item.level}"
      data-path="{item.path}"
      tabindex={focusedPath === item.path ? 0 : -1}
      title={getItemTitle(item)}
      onclick={(e) => handleBrowserItemClick(item, e)}
      ondblclick={(event) => handleItemDoubleClick(item, event)}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleBrowserItemClick(item, e);
        }
      }}
    >
      <BcxTreeItem item={withPreviewButton(withBrowserTreeItemState(item))} {itemActions} />
    </div>
  {:else}
    <a
      class="tree-item bcx-browser-row"
      class:focused={focusedPath === item.path}
      data-level="{item.level}"
      data-path="{item.path}"
      tabindex={focusedPath === item.path ? 0 : -1}
      onclick={(e) => handleItemClick(item, e)}
      ondblclick={(event) => handleItemDoubleClick(item, event)}
      href={item.href}
      title={getItemTitle(item)}
    >
      <BcxTreeItem item={withBrowserChildCount(item)} {itemActions} />
    </a>
  {/if}
{/snippet}

{#snippet browserEmptyState()}
  <li class="bcx-browser-empty-state" aria-live="polite">
    {#if isLoading || filterSearchLoading}
      <span class="bcx-browser-loading-icon" aria-hidden="true"></span>
    {/if}
    <span>{emptyStateMessage}</span>
  </li>
{/snippet}

{#snippet browserTreeItems(items: TreeItem[] | undefined)}
  <ol class="ml-0 mt-0 pl-0">
    {#if canNavigateToParentLevel()}
      <li>
        {@render backTreeItem(createDrillUpItem())}
      </li>
    {/if}
    {#if isTreeLayout}
      {#if getTreeLayoutNavigableItems().length > 0}
        <li>
          <BcxTreeRenderer
            items={currentLevelItems}
            {focusedPath}
            filterQuery={debouncedFilterQuery}
            visiblePaths={treeLayoutVisiblePaths}
            visibleChildCounts={treeLayoutVisibleChildCounts}
            onItemClick={handleItemClick}
            onItemDoubleClick={handleItemDoubleClick}
            {getItemTitle}
            decorateItem={withPreviewButton}
            {itemActions}
            onNodeClick={handleTreeLayoutNodeClick}
          />
        </li>
      {:else}
        {@render browserEmptyState()}
      {/if}
    {:else if items && items.length > 0}
      {#each items as item}
        <li>
          {@render browserTreeItem(item)}
        </li>
      {/each}
    {:else}
      {@render browserEmptyState()}
    {/if}
  </ol>
{/snippet}

<div class="flex min-h-0 flex-1 flex-col h-full gap-2">
  {#if showFilter}
    <div class="bcx-browser-toolbar">
    <div class="bcx-browser-filter">
    <BcxTreeBrowserFilter
      bind:this={filterRef}
      bind:value={() => effectiveFilterQuery, setFilterQuery}
      suggestions={filterSuggestions}
      onArrowDown={handleFilterArrowDown}
      onUnmatchedSubmit={handleUnmatchedFilterSubmit}
    />
    </div>
    {@render filterActions?.()}
    </div>
  {/if}
  {#if showBreadcrumb}
    <BcxTreeBreadcrumb
      items={breadcrumbItems}
      currentPath={rootPath}
      onNavigate={navigateToLevel}
    />
  {/if}
  <div
    bind:this={treeContainer}
    class="bcx-tree-view"
    role="tree"
    tabindex="0"
    onkeydown={handleKeyDown}
    onfocus={() => {
      if (!focusedPath && getNavigableItems().length > 0) {
        focusTreeItem(getNavigableItems()[0]);
      }
    }}
  >
    {#key treeVersion}
      {@render browserTreeItems(browserItems)}
    {/key}
  </div>
</div>

<style>
.bcx-browser-toolbar {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
}

.bcx-browser-filter {
  flex: 1 1 160px;
  min-width: 0;
}

.bcx-tree-view {
  flex: 1 1 0%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.bcx-browser-empty-state {
  align-items: center;
  color: rgb(156 163 175);
  display: flex;
  font-size: 0.875rem;
  gap: 0.5rem;
  justify-content: center;
  padding-block: 1rem;
}

.bcx-browser-loading-icon {
  animation: bcx-browser-loading-spin 700ms linear infinite;
  border: 2px solid rgb(156 163 175 / 0.35);
  border-top-color: rgb(229 231 235);
  border-radius: 9999px;
  display: inline-block;
  height: 0.875rem;
  width: 0.875rem;
}

@keyframes bcx-browser-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.bcx-browser-row {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
  padding-right: 0;
  padding-left: 1.5rem;
  padding-block: 0.25rem;
  color: rgb(229 231 235);
  text-align: left;
  text-decoration: none;
  transition: background-color 150ms;
  vertical-align: middle;
}

</style>
