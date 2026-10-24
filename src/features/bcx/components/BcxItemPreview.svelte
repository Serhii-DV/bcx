<script lang="ts">
import { X } from '@lucide/svelte';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { setContext } from 'svelte';
import {
  getItemPreviewId,
  getItemPreviewLabel,
  ITEM_PREVIEW_CONTEXT,
  type ItemPreviewContext,
} from '../stores/itemPreview';
import BcxBandPreview from './BcxBandPreview.svelte';
import BcxReleasePreview from './BcxReleasePreview.svelte';

let {
  item,
  onPreview,
  onClose,
}: {
  item?: TreeItem;
  onPreview: (item: TreeItem) => void;
  onClose: () => void;
} = $props();
let container: HTMLDivElement;
const title = $derived(
  item
    ? `Preview ${getItemPreviewLabel(item, { includeYear: false })}`
    : 'Preview',
);

setContext<ItemPreviewContext>(ITEM_PREVIEW_CONTEXT, {
  show: (selected) => onPreview(selected),
});

export function focus() {
  container.focus();
}
</script>

<div bind:this={container} class="item-preview" tabindex="-1">
  <header class="preview-header">
    <h2 title={title}>{title}</h2>
    <button type="button" class="bcx-section-tab preview-close" aria-label="Close Preview Panel" title="Close Preview Panel" onclick={onClose}>
      <X size={16} aria-hidden="true" />
    </button>
  </header>
  {#if item}
    {#key getItemPreviewId(item)}
      {#if item.bandPreview}
        <BcxBandPreview band={item.bandPreview} />
      {:else}
        <BcxReleasePreview {item} {onPreview} />
      {/if}
    {/key}
  {:else}
    <p role="status">Select a release, band, or track to preview it.</p>
  {/if}
</div>

<style>
.item-preview { --bcx-preview-column-width: 12rem; --bcx-preview-column-gap: 0.75rem; display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden; }
.preview-header { display: flex; align-items: center; flex-shrink: 0; gap: 8px; padding: 4px var(--bcx-preview-gutter, 16px); }
.preview-header h2 { flex: 1; min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 500; line-height: 20px; color: #e5e7eb; }
.preview-close { flex-shrink: 0; }
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; color: #9ca3af; }
</style>
