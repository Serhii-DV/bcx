<script lang="ts">
import {
  createReleaseDetailsTree,
  type ReleaseInformation,
  type ReleasePreview,
} from 'src/features/treeview/ReleasePreview';
import { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BcxTreeView from './BcxTreeView.svelte';

let {
  item,
  information,
  preview,
  loading,
  error,
}: {
  item: TreeItem;
  information: ReleaseInformation;
  preview: ReleasePreview | null;
  loading: boolean;
  error: string;
} = $props();
let treeData = $derived(
  preview ?? createReleaseDetailsTree(new TreeData(), information, item.href),
);
</script>

<div class="release-preview">
  <header class="release-header">
    {#if item.previewImage}
      <img class="release-cover" src={item.previewImage} alt={`Cover art for ${information.title}`} onerror={(event) => event.currentTarget.setAttribute('hidden', '')} />
    {/if}
    <div class="release-heading">
      <h3 class="release-artist">{information.artist}</h3>
      <h4 class="release-title">{information.title}</h4>
      {#if information.releaseYear}<div>{information.releaseYear}</div>{/if}
      {#if information.date}
        <div class="text-gray-400">
          Released on <relative-time datetime={information.date} format="datetime" month="short" day="numeric" year="numeric" time-zone="UTC">{information.date}</relative-time>
        </div>
      {/if}
      {#if information.collectionStatus.includes('Wishlisted') || information.price}
        <div class="release-badges">
          {#if information.collectionStatus.includes('Wishlisted')}<span class="wishlist-badge">Wishlisted</span>{/if}
          {#if information.price}<span>{information.price}</span>{/if}
        </div>
      {/if}
    </div>
  </header>
  <section class="release-tree" aria-label="Detailed release information">
    {#if loading}<p role="status">Loading release details…</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
    {#key preview}
      <BcxTreeView {treeData} showFilter={false} />
    {/key}
  </section>
</div>

<style>
.release-preview { display: flex; flex-direction: column; min-height: 100%; }
.release-header { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 1rem; }
.release-cover { width: min(15rem, 52%); aspect-ratio: 1; object-fit: contain; border-radius: 0.25rem; flex-shrink: 0; }
.release-heading { min-width: 0; flex: 1 1 0%; overflow-wrap: anywhere; font-size: 0.8125rem; }
.release-artist { margin: 0 0 0.25rem; font-size: 1.125rem; font-weight: 600; }
.release-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 500; }
.release-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.625rem; }
.wishlist-badge { border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
.release-tree { display: flex; flex: 1 1 20rem; flex-direction: column; }
p { margin: 0; padding: 0.5rem 0; font-size: 0.8125rem; }
</style>
