<script lang="ts">
import { loadCatalogArtistRows } from 'src/features/treeview/items/artistPanel';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { type Snippet, tick } from 'svelte';
import BcxCatalogSplitPanel from './BcxCatalogSplitPanel.svelte';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import BcxSectionSort from './BcxSectionSort.svelte';
import BcxTreePanel from './BcxTreePanel.svelte';
import { createItemUrl } from './itemUrl';
import {
  type CatalogGroupSort,
  createCatalogGroupComparator,
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
  createCatalogGroupComparator(catalog ? catalogSort : artistSort),
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

function createProfileRow(artist: TreeItem): TreeItem {
  return {
    pathKey: ARTIST_PROFILE_PATH_KEY,
    label: artist.label || 'Artist',
    labelPrefix: artist.label ? 'Artist' : undefined,
    image: artist.image,
    showArtwork: true,
    href: artist.href,
    bandPreview: artist.bandPreview,
  };
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
  <BcxSectionSort item={artistSortItem} iconOnly={splitView} onValueChange={setArtistSort} onCloseAutoFocus={handleSortCloseAutoFocus} />
{/snippet}

{#snippet artistItemActions(artist: TreeItem)}
  {#if artist.hasChildren && !artist.previewInformation}
    <BcxPreviewItemActions url={createItemUrl(artist.href)} image={artist.image} name={artist.label ?? ''} kind="artist" copyValue={artist.label ?? ''} previewItem={artist.bandPreview ? artist : undefined} iconOnly={true} />
  {/if}
{/snippet}

{#snippet artistReleases(artist: TreeItem)}
  {@const artistName = artist.label ?? ''}
  {@const profileRow = createProfileRow(artist)}
  {#snippet releasePaneActions(item: TreeItem)}
    {#if item.pathKey === ARTIST_PROFILE_PATH_KEY && !item.bandPreview}
      <BcxPreviewItemActions name={artistName} kind="artist" copyValue={artistName} iconOnly />
    {/if}
  {/snippet}
  <BcxTreePanel root={artist} leadingItem={profileRow} {onPreview} itemActions={releasePaneActions} showFilter={false} autoSelectPreview={false} />
{/snippet}

<div bind:this={container} class="artists-panel">
  {#if splitView}
    <BcxCatalogSplitPanel {root} groupLabel="Artists" itemLabel="Artist releases" emptyMessage="Select an artist to see their releases." items={artistReleases}>
      {#snippet groups(selectArtist, activeNodePath)}
        <BcxTreePanel root={artistRoot} {onPreview} filterActions={filterActions ?? artistSortControls} bind:filterQuery compareChildren={compareArtists} onActivateNode={selectArtist} {activeNodePath} />
      {/snippet}
    </BcxCatalogSplitPanel>
  {:else}
    <div class="artist-list" role="region" aria-label="Artists">
      <BcxTreePanel root={artistRoot} {onPreview} itemActions={artistItemActions} filterActions={filterActions ?? artistSortControls} bind:filterQuery compareChildren={compareArtists} />
    </div>
  {/if}
</div>

<style>
.artists-panel { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; }
.artist-list { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; }
</style>
