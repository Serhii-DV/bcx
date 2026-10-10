<script lang="ts">
import { loadCatalogArtistRows } from 'src/features/treeview/items/artistPanel';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { type Snippet, tick } from 'svelte';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import BcxSectionSort from './BcxSectionSort.svelte';
import BcxTreePanel from './BcxTreePanel.svelte';
import { createItemUrl } from './itemUrl';
import {
  type CatalogGroupSort,
  createCatalogArtistComparator,
} from './rootSectionTabs';
import type { SectionNavigationItem } from './sectionNavigation';

let {
  root,
  catalog = false,
  catalogSort = 'az',
  onPreview,
  filterActions,
  filterQuery = $bindable(null),
}: {
  root: TreeItem;
  catalog?: boolean;
  catalogSort?: CatalogGroupSort;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
  filterActions?: Snippet;
  filterQuery?: string | null;
} = $props();
let container = $state<HTMLDivElement | null>(null);
let artistSort = $state<'az' | 'za'>('az');
const artistRoot = $derived(
  catalog
    ? {
        ...root,
        childrenLoaded: false,
        loadChildren: () => loadCatalogArtistRows(root),
      }
    : root,
);
const compareArtists = $derived(
  createCatalogArtistComparator(catalog ? catalogSort : artistSort),
);
const artistSortItem = $derived<SectionNavigationItem>({
  id: root.path ?? 'artists',
  label: 'Artists',
  contentId: '',
  sortLabel: 'Sort artists by name',
  sortValue: artistSort,
  sortOptions: [
    { id: 'az', label: 'A–Z', title: 'Show artists in alphabetical order.' },
    {
      id: 'za',
      label: 'Z–A',
      title: 'Show artists in reverse alphabetical order.',
    },
  ],
});

function setArtistSort(id: string) {
  if (id === 'az' || id === 'za') artistSort = id;
}

async function handleSortCloseAutoFocus(event: Event) {
  event.preventDefault();
  await tick();
  if (!container?.closest('[hidden]'))
    container
      ?.querySelector<HTMLButtonElement>('[data-bcx-section-sort]')
      ?.focus();
}
</script>

{#snippet artistSortControls()}
  <BcxSectionSort item={artistSortItem} onValueChange={setArtistSort} onCloseAutoFocus={handleSortCloseAutoFocus} />
{/snippet}

{#snippet artistItemActions(artist: TreeItem)}
  {#if artist.hasChildren && !artist.previewInformation}
    <BcxPreviewItemActions url={createItemUrl(artist.href)} image={artist.image} name={artist.label ?? ''} kind="artist" copyValue={artist.label ?? ''} previewItem={artist.bandPreview ? artist : undefined} iconOnly={true} />
  {/if}
{/snippet}

<div bind:this={container} class="artists-panel">
  <BcxTreePanel root={artistRoot} {onPreview} itemActions={artistItemActions} filterActions={filterActions ?? artistSortControls} bind:filterQuery compareChildren={compareArtists} />
</div>

<style>
.artists-panel { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; }
</style>
