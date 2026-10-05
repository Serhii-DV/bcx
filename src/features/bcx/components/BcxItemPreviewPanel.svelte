<script lang="ts">
import { hasItemPreview, type TreeItem } from 'src/features/treeview/TreeItem';
import { onMount, type Snippet, setContext, untrack } from 'svelte';
import {
  ITEM_PREVIEW_CONTEXT,
  type ItemPreviewContext,
} from '../stores/itemPreview';
import {
  DEFAULT_ITEM_PREVIEW_SIZE,
  type ItemPreviewSizeStore,
  itemPreviewSize,
  MAX_ITEM_PREVIEW_SIZE,
  MIN_ITEM_PREVIEW_SIZE,
} from '../stores/itemPreviewSize';
import BcxItemPreviewTabs from './BcxItemPreviewTabs.svelte';

const KEYBOARD_RESIZE_STEP = 5;

let {
  children,
  visible = true,
  previewSize = itemPreviewSize,
}: {
  children: Snippet;
  visible?: boolean;
  previewSize?: ItemPreviewSizeStore;
} = $props();
const componentId = $props.id();
const itemListId = `${componentId}-item-list`;
const itemPreviewId = `${componentId}-item-preview`;
let previewPanel: HTMLDivElement;
let previewTabs = $state<BcxItemPreviewTabs>();
let isResizing = $state(false);
let resizeStartY = 0;
let resizeStartSize = DEFAULT_ITEM_PREVIEW_SIZE;

function selectItem(item: TreeItem) {
  if (hasItemPreview(item)) untrack(() => previewTabs?.selectPreview(item));
}

function previewItem(item: TreeItem) {
  if (hasItemPreview(item)) void previewTabs?.showPreview(item);
}

setContext<ItemPreviewContext>(ITEM_PREVIEW_CONTEXT, {
  select: selectItem,
  show: previewItem,
});
onMount(() => {
  void previewSize.restore();
});

function startResize(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return;
  if (!(event.currentTarget instanceof HTMLElement)) return;

  event.preventDefault();
  resizeStartY = event.clientY;
  resizeStartSize = $previewSize;
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
  previewSize.update(resizeStartSize + sizeChange);
}

function stopResize(event: PointerEvent) {
  if (isResizing) previewSize.save($previewSize);
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
      nextSize = $previewSize + KEYBOARD_RESIZE_STEP;
      break;
    case 'ArrowDown':
      nextSize = $previewSize - KEYBOARD_RESIZE_STEP;
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
  previewSize.save(nextSize);
}

function handleLostPointerCapture() {
  if (isResizing) previewSize.save($previewSize);
  isResizing = false;
}
</script>

<div
  bind:this={previewPanel}
  class:resizing={isResizing}
  class:preview-hidden={!visible}
  class="item-preview-panel"
  style:grid-template-rows={visible ? `${100 - $previewSize}fr auto ${$previewSize}fr` : '1fr'}
>
  <div id={itemListId} class="item-preview-panel-list">
    {@render children()}
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (ARIA separator is keyboard interactive) -->
  <div
    class="item-preview-panel-resizer"
    hidden={!visible}
    role="separator"
    aria-label="Resize item details"
    aria-orientation="horizontal"
    aria-controls={`${itemListId} ${itemPreviewId}`}
    aria-valuemin={MIN_ITEM_PREVIEW_SIZE}
    aria-valuemax={MAX_ITEM_PREVIEW_SIZE}
    aria-valuenow={Math.round($previewSize)}
    aria-valuetext={`Item details ${Math.round($previewSize)}% of available height`}
    tabindex="0"
    title="Drag to resize. Use Up and Down arrows, or press Enter to reset."
    onpointerdown={startResize}
    onpointermove={resize}
    onpointerup={stopResize}
    onpointercancel={stopResize}
    onlostpointercapture={handleLostPointerCapture}
    onkeydown={handleResizeKeydown}
    ondblclick={() => previewSize.save(DEFAULT_ITEM_PREVIEW_SIZE)}
  >
    <span aria-hidden="true"></span>
  </div>
  <section id={itemPreviewId} class="item-preview-panel-details" aria-label="Preview" hidden={!visible}>
    <BcxItemPreviewTabs bind:this={previewTabs} />
  </section>
</div>

<style>
.item-preview-panel { display: grid; flex: 1 1 0%; min-height: 0; overflow: hidden; }
.preview-hidden > [hidden] { display: none; }
.item-preview-panel.resizing { cursor: row-resize; user-select: none; }
.item-preview-panel-list, .item-preview-panel-details { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.item-preview-panel-resizer { display: flex; align-items: center; justify-content: center; box-sizing: content-box; width: 100%; height: 0.625rem; padding: 0; border: 0; border-block: 1px solid #4b5563; border-radius: 0; background: transparent; cursor: row-resize; touch-action: none; }
.item-preview-panel-resizer span { width: 2.5rem; height: 0.1875rem; border-radius: 9999px; background: #6b7280; }
.item-preview-panel-resizer:hover, .item-preview-panel-resizer:focus-visible, .item-preview-panel.resizing .item-preview-panel-resizer { border-color: #38bdf8; background: rgb(56 189 248 / 0.12); outline: none; }
.item-preview-panel-resizer:hover span, .item-preview-panel-resizer:focus-visible span, .item-preview-panel.resizing .item-preview-panel-resizer span { background: #7dd3fc; }
</style>
