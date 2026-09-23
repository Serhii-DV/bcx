<script lang="ts">
import {
  createReleaseDetailsTree,
  type ReleaseInformation,
  type ReleasePreview,
} from 'src/features/treeview/ReleasePreview';
import { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BcxItemDetailsLayout from './BcxItemDetailsLayout.svelte';

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

<BcxItemDetailsLayout
  image={item.previewImage}
  imageAlt={`Cover art for ${information.title}`}
  heading={information.artist}
  subheading={information.title}
  {treeData}
  detailsLabel="Detailed release information"
  {loading}
  loadingMessage="Loading release details…"
  {error}
>
  {#if information.releaseYear}<div class="release-year">{information.releaseYear}</div>{/if}
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
</BcxItemDetailsLayout>

<style>
.release-year { margin-bottom: 0.5rem; font-size: 1.75rem; font-weight: 300; line-height: 1.2; letter-spacing: 0.01em; }
.release-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.625rem; }
.wishlist-badge { border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
</style>
