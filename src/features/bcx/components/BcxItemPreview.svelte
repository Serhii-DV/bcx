<script lang="ts">
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { setContext } from 'svelte';
import {
  getItemPreviewId,
  ITEM_PREVIEW_CONTEXT,
  type ItemPreviewContext,
} from '../stores/itemPreview';
import BcxBandPreview from './BcxBandPreview.svelte';
import BcxReleasePreview from './BcxReleasePreview.svelte';

let {
  item,
  onPreview,
}: {
  item?: TreeItem;
  onPreview: (item: TreeItem) => void;
} = $props();
let container: HTMLDivElement;

setContext<ItemPreviewContext>(ITEM_PREVIEW_CONTEXT, {
  show: (selected) => onPreview(selected),
});

export function focus() {
  container.focus();
}
</script>

<div bind:this={container} class="item-preview" tabindex="-1">
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
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; color: #9ca3af; }
</style>
