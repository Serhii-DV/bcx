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
  bandUrl?: string;
  loading?: boolean;
  error?: string;
} = $props();
let profile = $derived(about.aboutProfile);
let expandedBiography = $state(false);
const componentId = $props.id();
const biographyId = `${componentId}-biography`;
const BIOGRAPHY_PREVIEW_LENGTH = 220;
let biography = $derived(profile?.biography?.trim());
let longBiography = $derived(
  (biography?.length ?? 0) > BIOGRAPHY_PREVIEW_LENGTH,
);
let biographyPreview = $derived(
  biography
    ?.slice(0, BIOGRAPHY_PREVIEW_LENGTH)
    .replace(/\s+\S*$/, '')
    .trimEnd(),
);
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

{#snippet biographyContent()}
  {#if biography}
    <div class="band-biography">
      <p id={biographyId}>{expandedBiography || !longBiography ? biography : `${biographyPreview}…`}</p>
      {#if longBiography}<button type="button" aria-expanded={expandedBiography} aria-controls={biographyId} onclick={() => { expandedBiography = !expandedBiography; }}>{expandedBiography ? 'Show less' : 'Read more'}</button>{/if}
    </div>
  {/if}
{/snippet}

<BcxItemDetailsLayout
  image={profile?.image}
  imageAlt={`${profile?.name ?? 'Band'} profile`}
  heading={profile?.name ?? about.label ?? 'Band'}
  subheading={location}
  subheadingPrefix={flagCode ? locationFlag : undefined}
  compactImage={true}
  details={biographyContent}
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
.following-badge { display: block; width: fit-content; margin-top: 0.375rem; border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
.band-biography { padding: 0 1rem 0.75rem; font-size: 0.8125rem; line-height: 1.5; }
.band-biography p { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
.band-biography button { margin-top: 0.25rem; padding: 0; border: 0; background: transparent; color: #7dd3fc; cursor: pointer; }
.band-biography button:focus-visible { outline: 1px solid #38bdf8; outline-offset: 2px; }
</style>
