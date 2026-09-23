<script lang="ts">
import { createTreeDataFromTreeItemChildren } from 'src/features/treeview/sections/treeDataFactory';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

let {
  about,
  loading = false,
  error = '',
}: {
  about: TreeItem;
  loading?: boolean;
  error?: string;
} = $props();
let treeData = $derived(
  createTreeDataFromTreeItemChildren(about, TREE_ITEM_LAYOUT.TREE),
);
</script>

<div class="band-details">
  {#if about.aboutProfile}
    <header class="about-profile">
      {#if about.aboutProfile.image}
        <img src={about.aboutProfile.image} alt={`${about.aboutProfile.name} profile`} onerror={(event) => event.currentTarget.setAttribute('hidden', '')} />
      {/if}
      <h3>{about.aboutProfile.name}</h3>
    </header>
  {/if}
  {#if loading}<p role="status">Loading saved band details…</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
  <BcxTreeBrowser {treeData} showBreadcrumb={false} showFilter={false} nativeTabNavigation={true} />
</div>

<style>
.band-details { display: flex; flex-direction: column; flex: 1 1 0%; min-height: 0; }
.about-profile { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; flex-shrink: 0; }
.about-profile img { width: 6rem; height: 6rem; object-fit: contain; border-radius: 0.25rem; }
.about-profile h3 { margin: 0; min-width: 0; font-size: 1rem; overflow-wrap: anywhere; }
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; }
</style>
