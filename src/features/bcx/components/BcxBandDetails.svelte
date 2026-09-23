<script lang="ts">
import 'country-flag-icons/3x2/flags.css';
import { createTreeDataFromTreeItemChildren } from 'src/features/treeview/sections/treeDataFactory';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { countryFlagCodeFromLocation } from 'src/features/treeview/utils/countryFlag';
import BcxItemDetailsLayout from './BcxItemDetailsLayout.svelte';

let {
  about,
  fallbackLocation,
  loading = false,
  error = '',
}: {
  about: TreeItem;
  fallbackLocation?: string;
  loading?: boolean;
  error?: string;
} = $props();
let profile = $derived(about.aboutProfile);
let location = $derived(profile?.location || fallbackLocation);
let flagCode = $derived(
  countryFlagCodeFromLocation(location) ??
    countryFlagCodeFromLocation(fallbackLocation),
);
let treeData = $derived(
  createTreeDataFromTreeItemChildren(about, TREE_ITEM_LAYOUT.TREE),
);
</script>

{#snippet locationFlag()}
  {#if flagCode}
    <span class={'flag:' + flagCode + ' location-flag'} aria-hidden="true"></span>
  {/if}
{/snippet}

<BcxItemDetailsLayout
  image={profile?.image}
  imageAlt={`${profile?.name ?? 'Band'} profile`}
  heading={profile?.name ?? about.label ?? 'Band'}
  subheading={location}
  subheadingPrefix={flagCode ? locationFlag : undefined}
  {treeData}
  detailsLabel="Detailed band information"
  {loading}
  loadingMessage="Loading saved band details…"
  {error}
>
  {#if profile?.following}<span class="following-badge">Following</span>{/if}
</BcxItemDetailsLayout>

<style>
.location-flag { --CountryFlagIcon-height: 1.25rem; flex-shrink: 0; }
.following-badge { display: inline-block; margin-top: 0.375rem; border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
</style>
