<script lang="ts">
import {
  createBandAboutFallback,
  loadBandAbout,
} from 'src/features/treeview/BandPreview';
import type { ReleasePreview } from 'src/features/treeview/ReleasePreview';
import type { TreeData } from 'src/features/treeview/TreeData';
import { hasItemPreview, type TreeItem } from 'src/features/treeview/TreeItem';
import { onMount } from 'svelte';
import {
  DEFAULT_ITEM_PREVIEW_SIZE,
  itemPreviewSize,
  MAX_ITEM_PREVIEW_SIZE,
  MIN_ITEM_PREVIEW_SIZE,
  restoreItemPreviewSize,
  saveItemPreviewSize,
  updateItemPreviewSize,
} from '../stores/itemPreviewSize';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxReleaseDetails from './BcxReleaseDetails.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

const KEYBOARD_RESIZE_STEP = 5;

let {
  treeData,
  rootPath,
  initialSelectedHref,
  filterQuery,
  showFilter = true,
  isLoading = false,
  onRootLoaded,
}: {
  treeData: TreeData;
  rootPath?: string;
  initialSelectedHref?: string;
  filterQuery?: string;
  showFilter?: boolean;
  isLoading?: boolean;
  onRootLoaded?: () => void;
} = $props();
let bandAbout: TreeItem | null = $state(null);
const componentId = $props.id();
const itemListId = `${componentId}-item-list`;
const itemPreviewId = `${componentId}-item-preview`;
let previewPanel: HTMLDivElement;
let selectedItem: TreeItem | null = $state(null);
let preview: ReleasePreview | null = $state(null);
let error = $state('');
let loading = $state(false);
let isResizing = $state(false);
let resizeStartY = 0;
let resizeStartSize = DEFAULT_ITEM_PREVIEW_SIZE;
let information = $derived.by(
  () => preview?.information ?? selectedItem?.previewInformation,
);

function selectItem(item: TreeItem | null) {
  selectedItem = hasItemPreview(item) ? item : null;
}

onMount(() => {
  void restoreItemPreviewSize();
});

function startResize(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return;
  if (!(event.currentTarget instanceof HTMLElement)) return;

  event.preventDefault();
  resizeStartY = event.clientY;
  resizeStartSize = $itemPreviewSize;
  isResizing = true;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function resize(event: PointerEvent) {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  if (!isResizing || !event.currentTarget.hasPointerCapture(event.pointerId))
    return;

  const availableHeight = previewPanel.clientHeight;
  if (!availableHeight) return;

  const sizeChange = ((resizeStartY - event.clientY) / availableHeight) * 100;
  updateItemPreviewSize(resizeStartSize + sizeChange);
}

function stopResize(event: PointerEvent) {
  if (isResizing) saveItemPreviewSize($itemPreviewSize);
  isResizing = false;
  if (
    event.currentTarget instanceof HTMLElement &&
    event.currentTarget.hasPointerCapture(event.pointerId)
  )
    event.currentTarget.releasePointerCapture(event.pointerId);
}

function handleResizeKeydown(event: KeyboardEvent) {
  let nextSize: number | null = null;

  switch (event.key) {
    case 'ArrowUp':
      nextSize = $itemPreviewSize + KEYBOARD_RESIZE_STEP;
      break;
    case 'ArrowDown':
      nextSize = $itemPreviewSize - KEYBOARD_RESIZE_STEP;
      break;
    case 'Home':
      nextSize = MIN_ITEM_PREVIEW_SIZE;
      break;
    case 'End':
      nextSize = MAX_ITEM_PREVIEW_SIZE;
      break;
    case 'Enter':
      nextSize = DEFAULT_ITEM_PREVIEW_SIZE;
      break;
  }

  if (nextSize === null) return;

  event.preventDefault();
  saveItemPreviewSize(nextSize);
}

function handleLostPointerCapture() {
  if (isResizing) saveItemPreviewSize($itemPreviewSize);
  isResizing = false;
}

$effect(() => {
  const item = selectedItem;
  let cancelled = false;
  preview = null;
  bandAbout = null;
  error = '';
  loading = !!(item?.loadPreview || item?.bandPreview);
  if (item?.bandPreview) {
    loadBandAbout(item.bandPreview)
      .then((data) => {
        if (!cancelled) bandAbout = data;
      })
      .catch(() => {
        if (!cancelled) error = 'Could not read saved band details.';
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });
  }
  if (item?.loadPreview) {
    item
      .loadPreview()
      .then((data) => {
        if (!cancelled) preview = data;
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          error =
            reason instanceof Error ? reason.message : 'Failed to load release';
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });
  }
  return () => {
    cancelled = true;
  };
});
</script>

<div
  bind:this={previewPanel}
  class:resizing={isResizing}
  class="item-preview-panel"
  style:grid-template-rows={`${100 - $itemPreviewSize}fr auto ${$itemPreviewSize}fr`}
>
  <div id={itemListId} class="item-preview-panel-list">
    <BcxTreeBrowser {treeData} initialRootPath={rootPath} lockInitialRoot={!!rootPath} {filterQuery} {showFilter} {isLoading} showBreadcrumb={false} initialSelectedHref={initialSelectedHref ?? treeData.items.find((item) => item.path === rootPath)?.initialSelectedHref} onSelect={selectItem} {onRootLoaded} nativeTabNavigation={true} />
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (ARIA separator is keyboard interactive) -->
  <div
    class="item-preview-panel-resizer"
    role="separator"
    aria-label="Resize item details"
    aria-orientation="horizontal"
    aria-controls={`${itemListId} ${itemPreviewId}`}
    aria-valuemin={MIN_ITEM_PREVIEW_SIZE}
    aria-valuemax={MAX_ITEM_PREVIEW_SIZE}
    aria-valuenow={Math.round($itemPreviewSize)}
    aria-valuetext={`Item details ${Math.round($itemPreviewSize)}% of available height`}
    tabindex="0"
    title="Drag to resize. Use Up and Down arrows, or press Enter to reset."
    onpointerdown={startResize}
    onpointermove={resize}
    onpointerup={stopResize}
    onpointercancel={stopResize}
    onlostpointercapture={handleLostPointerCapture}
    onkeydown={handleResizeKeydown}
    ondblclick={() => saveItemPreviewSize(DEFAULT_ITEM_PREVIEW_SIZE)}
  >
    <span aria-hidden="true"></span>
  </div>
  <section id={itemPreviewId} class="item-preview-panel-details" aria-label="Selected item details">
    {#if selectedItem?.bandPreview}
      <div class="item-preview-panel-content">
        {#key selectedItem}
          <BcxBandDetails about={bandAbout ?? createBandAboutFallback(selectedItem.bandPreview)} {loading} {error} />
        {/key}
      </div>
    {:else if selectedItem && information}
      <div class="item-preview-panel-content">
        {#key selectedItem}
          <BcxReleaseDetails item={selectedItem} {information} {preview} {loading} {error} />
        {/key}
      </div>
    {:else}
      <h3>Item details</h3>
      <p>Select a release or band to view its details.</p>
    {/if}
  </section>
</div>

<style>
.item-preview-panel { display: grid; flex: 1 1 0%; min-height: 0; overflow: hidden; }
.item-preview-panel.resizing { cursor: row-resize; user-select: none; }
.item-preview-panel-list, .item-preview-panel-details { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.item-preview-panel-resizer { display: flex; align-items: center; justify-content: center; box-sizing: content-box; width: 100%; height: 0.625rem; padding: 0; border: 0; border-block: 1px solid #4b5563; border-radius: 0; background: transparent; cursor: row-resize; touch-action: none; }
.item-preview-panel-resizer span { width: 2.5rem; height: 0.1875rem; border-radius: 9999px; background: #6b7280; }
.item-preview-panel-resizer:hover, .item-preview-panel-resizer:focus-visible, .item-preview-panel.resizing .item-preview-panel-resizer { border-color: #38bdf8; background: rgb(56 189 248 / 0.12); outline: none; }
.item-preview-panel-resizer:hover span, .item-preview-panel-resizer:focus-visible span, .item-preview-panel.resizing .item-preview-panel-resizer span { background: #7dd3fc; }
.item-preview-panel-content { display: flex; flex-direction: column; min-height: 0; overflow-y: auto; scrollbar-color: rgb(156 163 175 / 0.45) transparent; scrollbar-width: thin; }
h3 { margin: 0; padding: 0.5rem 1rem; font-size: 0.875rem; }
p { padding: 0.5rem 1rem; font-size: 0.875rem; color: #d1d5db; }
</style>
