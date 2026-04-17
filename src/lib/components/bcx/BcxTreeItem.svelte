<script lang="ts">
import type { TreeItem } from 'src/app/treeview/TreeItem';
import type { TreeItemButton } from 'src/app/treeview/TreeItemButton';
import { isNode } from 'src/app/treeview/utils';
import { makeIcon } from 'src/app/treeview/utils/icon';

interface Props {
  item: TreeItem;
  childCount?: number;
  showActions?: boolean;
}

let { item, childCount = 0, showActions = true }: Props = $props();
let hasChildren = $derived(isNode(item));
</script>

{#snippet treeItemButton(button: TreeItemButton)}
  {@const Icon = button.icon}
  {#if button.href}
    <a
      href={button.href}
      title={button.title}
      class="item-button inline-flex items-center justify-center p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
      onclick={(e) => {
        e.stopPropagation();
        if (button.onClick) {
          e.preventDefault();
          button.onClick(e.currentTarget as HTMLElement);
        }
      }}
    >
      <Icon size="16" />
    </a>
  {:else}
    <button
      type="button"
      title={button.title}
      class="item-button cursor-pointer inline-flex items-center justify-center p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
      onclick={(e) => {
        e.stopPropagation();
        if (button.onClick) {
          button.onClick(e.currentTarget as HTMLElement);
        }
      }}
    >
      <Icon size="16" />
    </button>
  {/if}
{/snippet}

{#snippet treeItemButtons(item: TreeItem)}
  {#if item.buttons && item.buttons.length > 0}
<div class="item-buttons">
  {#each item.buttons as button}
    {@render treeItemButton(button)}
  {/each}
</div>
  {/if}
{/snippet}

{#snippet treeItemIcon(item: TreeItem)}
  {@const Icon = makeIcon(item.actionIcon)}
  {#if Icon}
  <span class="item-icon text-gray-300"><Icon size="16" /></span>
  {/if}
{/snippet}

{#snippet treeItemImage(item: TreeItem)}
  {@const ImageIcon = makeIcon(item.image)}
  <span class="bcx-tree-item-img w-6 h-6 flex-shrink-0" aria-hidden={item.image ? undefined : 'true'}>
    {#if item.image && ImageIcon}
      <span class="bcx-tree-item-image-icon text-gray-300" aria-hidden="true">
        <ImageIcon size="24" />
      </span>
    {:else if item.image}
      <img src={item.image} alt={item.label} class="bcx-tree-item-image" loading="lazy" />
    {/if}
  </span>
{/snippet}

{@render treeItemImage(item)}
<span class="item-label" class:ml-2={!hasChildren}>{item.label}</span>
{#if showActions}
<div class="item-actions ml-auto flex gap-1 flex-shrink-0" role="presentation">
  {@render treeItemIcon(item)}
  {@render treeItemButtons(item)}
  {#if childCount > 0}
    <span class="item-count text-sm text-gray-400">{childCount}</span>
  {/if}
</div>
{/if}

<style>
.bcx-tree-item-img {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.125rem;
  margin-right: 0.5rem;
}

.bcx-tree-item-image-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bcx-tree-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-label,
.item-count {
  display: inline-flex;
  padding-block: 0.25rem;
  vertical-align: middle;
}

.item-actions {
  padding-right: 5px;
}

.item-icon {
  margin-left: 5px;
}

.item-icon,
.item-buttons {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

:global(.tree-item:hover) .item-icon,
:global(.tree-item:focus) .item-icon,
:global(.tree-item.focused) .item-icon,
:global(.tree-item:hover) .item-buttons,
:global(.tree-item:focus) .item-buttons,
:global(.tree-item.focused) .item-buttons {
  opacity: 1;
}
</style>
