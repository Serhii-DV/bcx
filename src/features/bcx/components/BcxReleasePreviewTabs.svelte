<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { ICON_DISC } from 'src/features/treeview/utils/icon';
import { tick, untrack } from 'svelte';
import BcxReleasePreview from './BcxReleasePreview.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import { createItemUrl } from './itemUrl';

let { item }: { item: TreeItem } = $props();
let previews = $state<{ id: string; item: TreeItem }[]>([]);
let activeId = $state('');
let container: HTMLDivElement;
const CURRENT_RELEASE_TAB = 'current-release';
let tabs = $derived(
  previews.map(({ id, item }) => {
    const label = previewTabLabel(item);
    return {
      id,
      label,
      image: item.image ?? ICON_DISC,
      title: `${label}${item.href ? `\n${item.href}` : ''}`,
      onClose: () => closePreview(id),
    };
  }),
);

function previewTabLabel(item: TreeItem): string {
  const information = item.previewInformation;
  const title = information?.title ?? item.label ?? 'Release';
  const year =
    information?.releaseYear ??
    (information?.date
      ? new Date(information.date).getUTCFullYear()
      : undefined);
  return `${information?.artist ? `${information.artist} - ` : ''}${title}${year && Number.isFinite(year) ? ` (${year})` : ''}`;
}

function releaseId(selected: TreeItem): string {
  return (
    createItemUrl(selected.href)?.toString() ??
    selected.id ??
    `${selected.previewInformation?.artist ?? ''}:${selected.previewInformation?.title ?? selected.label ?? selected.path ?? 'release'}`
  );
}

export function selectPreview(selected: TreeItem) {
  const current = previews.find(
    (preview) => preview.id === CURRENT_RELEASE_TAB,
  );
  const entry = { id: CURRENT_RELEASE_TAB, item: selected };
  if (!current) previews = [entry, ...previews];
  else if (releaseId(current.item) !== releaseId(selected))
    previews = previews.map((preview) =>
      preview.id === CURRENT_RELEASE_TAB ? entry : preview,
    );
  activeId = CURRENT_RELEASE_TAB;
}

export async function showPreview(selected: TreeItem) {
  const id = releaseId(selected);
  if (!previews.some((preview) => preview.id === id)) {
    previews = [...previews, { id, item: selected }];
  }
  activeId = id;
  await focusActiveTab();
}

$effect(() => {
  const selected = item;
  untrack(() => selectPreview(selected));
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
    '[role="tablist"][aria-label="Previewed releases"] [role="tab"][aria-selected="true"]',
  );
  (activeTab ?? container).focus();
}
</script>

<div bind:this={container} class="release-preview-tabs" tabindex="-1">
  <Tabs.Root bind:value={activeId} class="bcx-panel-body">
    {#if tabs.length}
      <BcxSectionTabs {tabs} bind:value={activeId} label="Previewed releases" />
    {:else}
      <p role="status">No release previews open. Select a release to preview it.</p>
    {/if}
    {#each previews as preview (preview.id)}
      <Tabs.Content value={preview.id} class="bcx-tab-content">
        {#key releaseId(preview.item)}
        <BcxReleasePreview item={preview.item} onPreview={showPreview} />
        {/key}
      </Tabs.Content>
    {/each}
  </Tabs.Root>
</div>

<style>
.release-preview-tabs { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; color: #9ca3af; }
</style>
