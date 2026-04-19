<script lang="ts">
import type { TreeItem } from 'src/app/treeview/TreeItem';
import type { TreeItemButton } from 'src/app/treeview/TreeItemButton';
import { makeIcon } from 'src/app/treeview/utils/icon';

interface Props {
  item: TreeItem;
  showActions?: boolean;
}

let { item, showActions = true }: Props = $props();
let childrenCount = $derived(item.childrenCount ?? item.children?.length ?? 0);
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

{#snippet treeItemActionIcon(item: TreeItem)}
  {@const Icon = makeIcon(item.actionIcon)}
  <span
    class="item-action-feedback text-emerald-300"
    aria-live="polite"
    aria-atomic="true"
  ></span>
  {#if Icon}
  <span class="item-action-icon text-gray-300"><Icon size="16" /></span>
  {/if}
{/snippet}

{#snippet treeItemImage(item: TreeItem)}
  {@const ImageIcon = makeIcon(item.image)}
  <span class="bcx-tree-item-img w-6 h-6 flex-shrink-0" aria-hidden={item.image ? undefined : 'true'}>
    {#if item.image && ImageIcon}
      <span class="bcx-tree-item-image-icon text-gray-300" aria-hidden="true">
        <ImageIcon size="16" />
      </span>
    {:else if item.image}
      <img src={item.image} alt={item.label} class="bcx-tree-item-image" loading="lazy" />
    {/if}
  </span>
{/snippet}

{@render treeItemImage(item)}
<span class="item-label">{item.label}</span>
{#if showActions}
<div class="item-actions ml-auto flex gap-1 flex-shrink-0" role="presentation">
  {@render treeItemButtons(item)}
  {#if childrenCount > 0}
    <span class="item-count text-gray-400">{childrenCount}</span>
  {/if}
</div>
{@render treeItemActionIcon(item)}
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
  width: 1.125rem;
  height: 1.125rem;
  object-fit: cover;
}

.item-label,
.item-count {
  display: inline-flex;
  padding-block: 0.25rem;
  vertical-align: middle;
}

.item-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.item-count {
  font-size: 0.75rem;
}

.item-actions {
  padding-right: 5px;
}

.item-action-icon {
  margin: 0 5px;
}

.item-action-feedback {
  display: none;
  margin: 0 5px;
  font-size: 0.75rem;
  font-weight: 600;
}

:global(.tree-item[data-action-feedback="true"]) .item-action-feedback {
  display: inline-flex;
}

:global(.tree-item[data-action-feedback="true"]) .item-action-icon {
  display: none;
}

.item-buttons {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

:global(.tree-item:hover) .item-buttons,
:global(.tree-item:focus) .item-buttons,
:global(.tree-item.focused) .item-buttons {
  opacity: 1;
}

:global(.tree-item) {
  max-width: 100%;
  min-width: 0;
}
</style>
