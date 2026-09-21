<script lang="ts">
import type { ReleasePreview } from 'src/features/treeview/ReleasePreview';
import type { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import {
  DEFAULT_RELEASE_PREVIEW_SIZE,
  MAX_RELEASE_PREVIEW_SIZE,
  MIN_RELEASE_PREVIEW_SIZE,
  releasePreviewSize,
} from '../stores/releasePreviewSize';
import BcxReleaseDetails from './BcxReleaseDetails.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

const KEYBOARD_RESIZE_STEP = 5;

let { treeData, rootPath }: { treeData: TreeData; rootPath: string } = $props();
const componentId = $props.id();
const releaseListId = `${componentId}-release-list`;
const releasePreviewId = `${componentId}-release-preview`;
let releaseBrowser: HTMLDivElement;
let selectedItem: TreeItem | null = $state(null);
let preview: ReleasePreview | null = $state(null);
let error = $state('');
let loading = $state(false);
let isResizing = $state(false);
let resizeStartY = 0;
let resizeStartSize = DEFAULT_RELEASE_PREVIEW_SIZE;
let information = $derived.by(
  () => preview?.information ?? selectedItem?.previewInformation,
);

function selectItem(item: TreeItem | null) {
  selectedItem = item?.loadPreview ? item : null;
}

function clampPreviewSize(size: number) {
  return Math.min(
    MAX_RELEASE_PREVIEW_SIZE,
    Math.max(MIN_RELEASE_PREVIEW_SIZE, size),
  );
}

function startResize(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return;
  if (!(event.currentTarget instanceof HTMLElement)) return;

  event.preventDefault();
  resizeStartY = event.clientY;
  resizeStartSize = $releasePreviewSize;
  isResizing = true;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function resize(event: PointerEvent) {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  if (!isResizing || !event.currentTarget.hasPointerCapture(event.pointerId))
    return;

  const availableHeight = releaseBrowser.clientHeight;
  if (!availableHeight) return;

  const sizeChange = ((resizeStartY - event.clientY) / availableHeight) * 100;
  releasePreviewSize.set(clampPreviewSize(resizeStartSize + sizeChange));
}

function stopResize(event: PointerEvent) {
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
      nextSize = $releasePreviewSize + KEYBOARD_RESIZE_STEP;
      break;
    case 'ArrowDown':
      nextSize = $releasePreviewSize - KEYBOARD_RESIZE_STEP;
      break;
    case 'Home':
      nextSize = MIN_RELEASE_PREVIEW_SIZE;
      break;
    case 'End':
      nextSize = MAX_RELEASE_PREVIEW_SIZE;
      break;
    case 'Enter':
      nextSize = DEFAULT_RELEASE_PREVIEW_SIZE;
      break;
  }

  if (nextSize === null) return;

  event.preventDefault();
  releasePreviewSize.set(clampPreviewSize(nextSize));
}

$effect(() => {
  const item = selectedItem;
  let cancelled = false;
  preview = null;
  error = '';
  loading = !!item?.loadPreview;
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
  bind:this={releaseBrowser}
  class:resizing={isResizing}
  class="release-browser"
  style:grid-template-rows={`${100 - $releasePreviewSize}fr auto ${$releasePreviewSize}fr`}
>
  <div id={releaseListId} class="release-list">
    <BcxTreeBrowser {treeData} initialRootPath={rootPath} lockInitialRoot={true} showBreadcrumb={false} initialSelectedHref={treeData.items.find((item) => item.path === rootPath)?.initialSelectedHref} onSelect={selectItem} nativeTabNavigation={true} />
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (ARIA separator is keyboard interactive) -->
  <div
    class="release-resizer"
    role="separator"
    aria-label="Resize release details"
    aria-orientation="horizontal"
    aria-controls={`${releaseListId} ${releasePreviewId}`}
    aria-valuemin={MIN_RELEASE_PREVIEW_SIZE}
    aria-valuemax={MAX_RELEASE_PREVIEW_SIZE}
    aria-valuenow={Math.round($releasePreviewSize)}
    aria-valuetext={`Release details ${Math.round($releasePreviewSize)}% of available height`}
    tabindex="0"
    title="Drag to resize. Use Up and Down arrows, or press Enter to reset."
    onpointerdown={startResize}
    onpointermove={resize}
    onpointerup={stopResize}
    onpointercancel={stopResize}
    onlostpointercapture={() => (isResizing = false)}
    onkeydown={handleResizeKeydown}
    ondblclick={() => releasePreviewSize.set(DEFAULT_RELEASE_PREVIEW_SIZE)}
  >
    <span aria-hidden="true"></span>
  </div>
  <section id={releasePreviewId} class="release-preview" aria-label="Selected release details">
    {#if selectedItem && information}
      <div class="release-preview-content">
        {#key selectedItem}
          <BcxReleaseDetails item={selectedItem} {information} {preview} {loading} {error} />
        {/key}
      </div>
    {:else}
      <h3>Release details</h3>
      <p>Select a release to view its details.</p>
    {/if}
  </section>
</div>

<style>
.release-browser { display: grid; flex: 1 1 0%; min-height: 0; overflow: hidden; }
.release-browser.resizing { cursor: row-resize; user-select: none; }
.release-list, .release-preview { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.release-resizer { display: flex; align-items: center; justify-content: center; box-sizing: content-box; width: 100%; height: 0.625rem; padding: 0; border: 0; border-block: 1px solid #4b5563; border-radius: 0; background: transparent; cursor: row-resize; touch-action: none; }
.release-resizer span { width: 2.5rem; height: 0.1875rem; border-radius: 9999px; background: #6b7280; }
.release-resizer:hover, .release-resizer:focus-visible, .release-browser.resizing .release-resizer { border-color: #38bdf8; background: rgb(56 189 248 / 0.12); outline: none; }
.release-resizer:hover span, .release-resizer:focus-visible span, .release-browser.resizing .release-resizer span { background: #7dd3fc; }
.release-preview-content { min-height: 0; overflow-y: auto; scrollbar-color: rgb(156 163 175 / 0.45) transparent; scrollbar-width: thin; }
h3 { margin: 0; padding: 0.5rem 1rem; font-size: 0.875rem; }
p { padding: 0.5rem 1rem; font-size: 0.875rem; color: #d1d5db; }
</style>
