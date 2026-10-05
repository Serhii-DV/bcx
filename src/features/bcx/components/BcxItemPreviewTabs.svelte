<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { ICON_DISC, ICON_MIC } from 'src/features/treeview/utils/icon';
import { setContext, tick } from 'svelte';
import {
  ITEM_PREVIEW_CONTEXT,
  type ItemPreviewContext,
} from '../stores/itemPreview';
import BcxBandPreview from './BcxBandPreview.svelte';
import BcxReleasePreview from './BcxReleasePreview.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import { createItemUrl } from './itemUrl';

let previews = $state<{ id: string; item: TreeItem }[]>([]);
let activeId = $state('');
let container: HTMLDivElement;
const CURRENT_ITEM_TAB = 'current-item';
let tabs = $derived(
  previews.map(({ id, item }) => {
    const label = `${id === CURRENT_ITEM_TAB ? 'Preview: ' : ''}${previewTabLabel(item)}`;
    return {
      id,
      label,
      image:
        item.image ??
        item.bandPreview?.image ??
        (item.bandPreview ? ICON_MIC : ICON_DISC),
      title: `${label}\n${createItemUrl(item.bandPreview?.url ?? item.href ?? item.id)?.toString() ?? ''}`,
      onClose: () => closePreview(id),
    };
  }),
);

function previewTabLabel(item: TreeItem): string {
  if (item.bandPreview) return item.bandPreview.name;
  const information = item.previewInformation;
  const title = information?.title ?? item.label ?? 'Release';
  const year =
    information?.releaseYear ??
    (information?.date
      ? new Date(information.date).getUTCFullYear()
      : undefined);
  return `${information?.artist ? `${information.artist} - ` : ''}${title}${year && Number.isFinite(year) ? ` (${year})` : ''}`;
}

function previewId(selected: TreeItem): string {
  return (
    createItemUrl(
      selected.bandPreview?.url ?? selected.href ?? selected.id,
    )?.toString() ??
    selected.id ??
    `${selected.previewInformation?.artist ?? ''}:${selected.previewInformation?.title ?? selected.label ?? selected.path ?? 'release'}`
  );
}

export function selectPreview(selected: TreeItem) {
  const current = previews.find((preview) => preview.id === CURRENT_ITEM_TAB);
  const entry = { id: CURRENT_ITEM_TAB, item: selected };
  if (!current) previews = [entry, ...previews];
  else if (previewId(current.item) !== previewId(selected))
    previews = previews.map((preview) =>
      preview.id === CURRENT_ITEM_TAB ? entry : preview,
    );
  activeId = CURRENT_ITEM_TAB;
}

export async function showPreview(selected: TreeItem) {
  const id = previewId(selected);
  if (!previews.some((preview) => preview.id === id)) {
    previews = [...previews, { id, item: selected }];
  }
  activeId = id;
  await focusActiveTab();
}

setContext<ItemPreviewContext>(ITEM_PREVIEW_CONTEXT, {
  show: (item) => {
    void showPreview(item);
  },
});

async function closePreview(id: string) {
  const index = previews.findIndex((preview) => preview.id === id);
  if (index < 0) return;
  previews = previews.filter((preview) => preview.id !== id);
  if (activeId === id)
    activeId = previews[Math.min(index, previews.length - 1)]?.id ?? '';
  await focusActiveTab();
}

async function focusActiveTab() {
  await tick();
  const activeTab = container.querySelector<HTMLElement>(
    '[role="tablist"][aria-label="Previewed releases and bands"] [role="tab"][aria-selected="true"]',
  );
  (activeTab ?? container).focus();
}
</script>

<div bind:this={container} class="item-preview-tabs" tabindex="-1">
  <Tabs.Root bind:value={activeId} class="bcx-panel-body">
    {#if tabs.length}
      <BcxSectionTabs {tabs} bind:value={activeId} label="Previewed releases and bands" />
    {:else}
      <p role="status">No previews open. Select a release or band to preview it.</p>
    {/if}
    {#each previews as preview (preview.id)}
      <Tabs.Content value={preview.id} class="bcx-tab-content">
        {#key previewId(preview.item)}
          {#if preview.item.bandPreview}
            <BcxBandPreview band={preview.item.bandPreview} />
          {:else}
            <BcxReleasePreview item={preview.item} onPreview={showPreview} />
          {/if}
        {/key}
      </Tabs.Content>
    {/each}
  </Tabs.Root>
</div>

<style>
.item-preview-tabs { --bcx-preview-gutter: 1rem; --bcx-preview-column-width: 12rem; --bcx-preview-column-gap: 0.75rem; display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; color: #9ca3af; }
</style>
