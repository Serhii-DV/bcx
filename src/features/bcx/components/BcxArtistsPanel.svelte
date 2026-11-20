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

const ARTIST_PROFILE_PATH_KEY = 'artist-profile';

let {
  root,
  catalog = false,
  catalogSort = 'az',
  splitView = false,
  onPreview,
  filterActions,
  filterQuery = $bindable(null),
}: {
  root: TreeItem;
  catalog?: boolean;
  catalogSort?: CatalogGroupSort;
  splitView?: boolean;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
  filterActions?: Snippet;
  filterQuery?: string | null;
} = $props();
let container = $state<HTMLDivElement | null>(null);
let selection = $state.raw<{ root: TreeItem; artist: TreeItem }>();
const selectedArtist = $derived(
  selection?.root === root ? selection.artist : undefined,
);
const artistName = $derived(selectedArtist?.label ?? '');
const profileRow = $derived<TreeItem | undefined>(
  selectedArtist && {
    pathKey: ARTIST_PROFILE_PATH_KEY,
    label: artistName || 'Artist',
    labelPrefix: artistName ? 'Artist' : undefined,
    image: selectedArtist.image,
    showArtwork: true,
    href: selectedArtist.href,
    bandPreview: selectedArtist.bandPreview,
  },
);
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

function activateArtist(artist: TreeItem) {
  if (selectedArtist?.path !== artist.path) selection = { root, artist };
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

{#snippet releasePaneActions(item: TreeItem)}
  {#if item.pathKey === ARTIST_PROFILE_PATH_KEY && !item.bandPreview}
    <BcxPreviewItemActions name={artistName} kind="artist" copyValue={artistName} iconOnly />
  {/if}
{/snippet}

<div bind:this={container} class="artists-panel" class:split={splitView}>
  <div class="artist-list" role="region" aria-label="Artists">
    <BcxTreePanel root={artistRoot} {onPreview} itemActions={splitView ? undefined : artistItemActions} filterActions={filterActions ?? artistSortControls} bind:filterQuery compareChildren={compareArtists} doubleClickToExpand onActivateNode={splitView ? activateArtist : undefined} activeNodePath={selectedArtist?.path} />
  </div>
  {#if splitView}
    <div class="artist-releases" role="region" aria-label="Artist releases">
      {#if selectedArtist}
        {#key selectedArtist}
          <BcxTreePanel root={selectedArtist} leadingItem={profileRow} {onPreview} itemActions={releasePaneActions} showFilter={false} autoSelectPreview={false} />
        {/key}
      {:else}
        <p>Select an artist to see their releases.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
.artists-panel { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; }
.artists-panel.split { display: grid; grid-template-columns: min(32%, 11rem) minmax(0, 1fr); gap: 0.5rem; }
.artist-list, .artist-releases { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; }
.split .artist-list { container-type: inline-size; }
.split .artist-list :global(.bcx-browser-toolbar) {
  flex-wrap: nowrap;
  gap: 0.25rem;
}
.split .artist-list :global(.bcx-section-sort) { flex: none; }
.artist-releases { gap: 0.5rem; border-inline-start: 1px solid rgb(156 163 175 / 0.25); padding-inline-start: 0.5rem; }
.split .artist-list :global(.bcx-tree-item-img.largeArtwork) { width: 1.5rem; height: 1.5rem; }
.split .artist-list :global(.item-url) { display: none; }
@container (max-width: 10rem) {
  .split .artist-list :global(.bcx-section-sort) {
    justify-content: center;
    width: 2rem;
    padding-inline: 0;
  }
  .split .artist-list :global(.bcx-section-sort-label),
  .split .artist-list :global(.bcx-section-sort > svg:last-child) {
    display: none;
  }
  .split .artist-list :global(.bcx-tree-filter-input) {
    padding-inline: 0.25rem;
  }
}
@container (max-width: 7rem) {
  .split .artist-list :global(.bcx-tree-item-img.largeArtwork) { display: none; }
}
p { margin: 0; overflow-wrap: anywhere; color: #9ca3af; font-size: 0.875rem; }
</style>
