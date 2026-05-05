<script lang="ts">
import type { TreeDataSection } from 'src/app/treeview/TreeData';
import type { TreeItem } from 'src/app/treeview/TreeItem';
import {
  createFilteredTreeItems,
  hydrateTreeItemChildren,
  isNode,
} from 'src/app/treeview/utils';
import { ICON_CHEVRON_RIGHT } from 'src/app/treeview/utils/icon';
import BcxTreeItem from './BcxTreeItem.svelte';
import { filterTreeItemsFlat } from './treeViewHelpers';

interface Props {
  section: TreeDataSection;
  isOpen: boolean;
  focusedPath?: string | null;
  filterQuery?: string;
  findItemByPath: (path?: string | null) => TreeItem | null;
  onOpenChange: (section: TreeDataSection, isOpen: boolean) => void;
  onItemClick: (
    item: TreeItem,
    event: MouseEvent | KeyboardEvent,
  ) => void | Promise<void>;
  onBrowserItemClick: (
    item: TreeItem,
    event: MouseEvent | KeyboardEvent,
  ) => void | Promise<void>;
  refreshTreeRendering: () => void;
}

let {
  section,
  isOpen,
  focusedPath = null,
  filterQuery = '',
  findItemByPath,
  onOpenChange,
  onItemClick,
  onBrowserItemClick,
  refreshTreeRendering,
}: Props = $props();

let sectionItem = $derived(findItemByPath(section.itemPath));
let isExpanded = $derived(isOpen || !!filterQuery.trim());
let sectionItems = $derived.by(() => getSectionItems());
let isVisible = $derived.by(() => sectionMatchesFilter());

async function toggleSection() {
  const nextOpen = !isOpen;
  onOpenChange(section, nextOpen);

  if (!nextOpen || !sectionItem?.loadChildren || sectionItem.childrenLoaded) {
    return;
  }

  sectionItem.isLoadingChildren = true;
  refreshTreeRendering();
  await hydrateTreeItemChildren(sectionItem, true);
  refreshTreeRendering();
}

function sectionMatchesFilter(): boolean {
  if (!filterQuery.trim()) {
    return true;
  }

  return sectionItem
    ? filterTreeItemsFlat([sectionItem], filterQuery).length > 0
    : false;
}

function getSectionItems(): TreeItem[] {
  if (!sectionItem?.children) {
    return [];
  }

  if (!filterQuery.trim()) {
    return sectionItem.children;
  }

  return createFilteredTreeItems(sectionItem.children, filterQuery);
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

function getSectionTitleItem(): TreeItem {
  return {
    ...(sectionItem || {}),
    label: section.label,
    actionIcon: undefined,
  };
}
</script>

{#snippet browserTreeItem(item: TreeItem)}
  {@const hasChildren = isNode(item)}
  {#if hasChildren}
    <div
      role="button"
      class="tree-item bcx-browser-row"
      class:focused={focusedPath === item.path}
      data-level="{item.level}"
      data-path="{item.path}"
      tabindex={focusedPath === item.path ? 0 : -1}
      title={item.hint}
      onclick={(event) => onBrowserItemClick(item, event)}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onBrowserItemClick(item, event);
        }
      }}
    >
      <BcxTreeItem item={withBrowserTreeItemState(item)} />
    </div>
  {:else}
    <a
      class="tree-item bcx-browser-row"
      class:focused={focusedPath === item.path}
      data-level="{item.level}"
      data-path="{item.path}"
      tabindex={focusedPath === item.path ? 0 : -1}
      onclick={(event) => onItemClick(item, event)}
      href={item.href}
      title={item.hint}
    >
      <BcxTreeItem item={withBrowserChildCount(item)} />
    </a>
  {/if}
{/snippet}

{#if isVisible}
  <section class="bcx-tree-section">
    <button
      type="button"
      class="bcx-tree-section-header"
      class:open={isExpanded}
      aria-expanded={isExpanded}
      aria-controls={`bcx-tree-section-${section.id}`}
      onclick={toggleSection}
    >
      <span class="bcx-tree-section-chevron" aria-hidden="true"></span>
      <BcxTreeItem item={getSectionTitleItem()} showActions={false} />
      {#if sectionItem && getItemVisibleChildCount(sectionItem) > 0}
        <span class="bcx-tree-section-count">{getItemVisibleChildCount(sectionItem)}</span>
      {/if}
    </button>
    {#if isExpanded}
      <div id={`bcx-tree-section-${section.id}`} class="bcx-tree-section-body">
        {#if sectionItem?.isLoadingChildren}
          <div class="bcx-tree-section-empty">Loading...</div>
        {:else if sectionItems.length > 0}
          <ol class="ml-0 mt-0 pl-0">
            {#each sectionItems as item}
              <li>
                {@render browserTreeItem(item)}
              </li>
            {/each}
          </ol>
        {:else}
          <div class="bcx-tree-section-empty">
            {filterQuery.trim() ? 'No items match your filter' : 'No items here'}
          </div>
        {/if}
      </div>
    {/if}
  </section>
{/if}

<style>
.bcx-tree-section {
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

.bcx-tree-section:first-child {
  border-top: 0;
}

.bcx-tree-section-header {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: rgb(229 231 235);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  padding: 0.25rem 0.25rem 0.25rem 0;
  text-align: left;
}

.bcx-tree-section-header:hover,
.bcx-tree-section-header:focus {
  background-color: rgb(255 255 255 / 0.1);
  outline: none;
}

.bcx-tree-section-chevron {
  display: inline-flex;
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  margin-right: 0.25rem;
  background-color: currentcolor;
  transform: rotate(0deg);
  transition: transform 120ms ease;
  -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>');
          mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>');
  -webkit-mask-size: cover;
          mask-size: cover;
}

.bcx-tree-section-header.open .bcx-tree-section-chevron {
  transform: rotate(90deg);
}

.bcx-tree-section-body {
  padding-bottom: 0.25rem;
}

.bcx-tree-section-empty {
  color: rgb(156 163 175);
  font-size: 0.875rem;
  padding: 0.5rem 0.5rem 0.5rem 1.5rem;
}

.bcx-tree-section-count {
  color: rgb(156 163 175);
  flex: 0 0 auto;
  font-size: 0.75rem;
  margin-left: auto;
  padding-left: 0.5rem;
}

.bcx-browser-row {
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: 4px;
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

.bcx-browser-row:hover {
  background-color: rgb(255 255 255 / 0.1);
}

.bcx-browser-row:focus {
  background-color: rgb(255 255 255 / 0.2);
  outline: 2px solid rgb(255 255 255 / 0.9);
  outline-offset: 0;
}
</style>
