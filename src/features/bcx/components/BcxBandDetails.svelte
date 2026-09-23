<script lang="ts">
import { createTreeDataFromTreeItemChildren } from 'src/features/treeview/sections/treeDataFactory';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import BcxItemDetailsLayout from './BcxItemDetailsLayout.svelte';

let {
  about,
  loading = false,
  error = '',
}: {
  about: TreeItem;
  loading?: boolean;
  error?: string;
} = $props();
let profile = $derived(about.aboutProfile);
let treeData = $derived(
  createTreeDataFromTreeItemChildren(about, TREE_ITEM_LAYOUT.TREE),
);
</script>

<BcxItemDetailsLayout
  image={profile?.image}
  imageAlt={`${profile?.name ?? 'Band'} profile`}
  heading={profile?.name ?? about.label ?? 'Band'}
  subheading={profile?.location}
  {treeData}
  detailsLabel="Detailed band information"
  {loading}
  loadingMessage="Loading saved band details…"
  {error}
>
  {#if profile?.following}<span class="following-badge">Following</span>{/if}
</BcxItemDetailsLayout>

<style>
.following-badge { display: inline-block; margin-top: 0.375rem; border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
</style>
