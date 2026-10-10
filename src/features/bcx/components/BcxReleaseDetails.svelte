<script lang="ts">
import {
  type BandLinkProfile,
  loadReleaseBandLinks,
} from 'src/features/treeview/BandPreview';
import { loadRelatedArtistReleases } from 'src/features/treeview/items/relatedReleasesTreeItem';
import {
  createReleaseDetailsTree,
  getReleaseArtistNames,
  type ReleaseInformation,
  type ReleasePreview,
} from 'src/features/treeview/ReleasePreview';
import { watchSavedPreviewLibrary } from 'src/features/treeview/savedPreviewLibrary';
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { items, text } from 'src/features/treeview/TreeItemBuilder';
import {
  ICON_FILE_TEXT,
  ICON_INFO,
  ICON_LIST_MUSIC,
  ICON_MIC,
  ICON_TAGS,
} from 'src/features/treeview/utils/icon';
import { type Snippet, untrack } from 'svelte';
import { musicFilterStore } from '../stores/musicFilter';
import BcxArtistsPanel from './BcxArtistsPanel.svelte';
import BcxItemDetailsLayout from './BcxItemDetailsLayout.svelte';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxTreePanel from './BcxTreePanel.svelte';
import { createItemUrl } from './itemUrl';

let {
  item,
  information,
  preview,
  loading,
  error,
  onPreview,
  leadingActions,
}: {
  item: TreeItem;
  information: ReleaseInformation;
  preview: ReleasePreview | null;
  loading: boolean;
  error: string;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
  leadingActions?: Snippet;
} = $props();
let releaseUrl = $derived(createItemUrl(item.href ?? item.id));

function bandPreviewItem(band: BandLinkProfile): TreeItem {
  return {
    label: band.name,
    href: band.url.toString(),
    image: band.image,
    showArtwork: true,
    bandPreview: {
      name: band.name,
      url: band.url.toString(),
      image: band.image,
      cached: false,
    },
  };
}

let bandLinks = $state<Awaited<ReturnType<typeof loadReleaseBandLinks>>>({
  artists: [],
  detectedArtists: [],
  releases: [],
});
let bandLinksError = $state('');
let artistNames = $derived(getReleaseArtistNames(information));
function artistLinks(name: string): BandLinkProfile[] {
  return bandLinks.detectedArtists.filter(
    (band) => band.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
}
let libraryRevision = $state(0);
$effect(() =>
  watchSavedPreviewLibrary(() => {
    libraryRevision += 1;
  }),
);
// Object replacement during hydration should not repeat the same lookup.
let bandLinksKey = $derived(
  JSON.stringify([
    releaseUrl?.toString(),
    information.title,
    information.artist,
    information.artistUrl,
    information.publisher,
    information.publisherUrl,
    artistNames,
  ]),
);
$effect(() => {
  bandLinksKey;
  libraryRevision;
  const [currentInformation, currentUrl] = untrack(
    () => [information, releaseUrl] as const,
  );
  let cancelled = false;
  bandLinks = { artists: [], detectedArtists: [], releases: [] };
  bandLinksError = '';
  void untrack(() => loadReleaseBandLinks(currentInformation, currentUrl))
    .then((links) => {
      if (!cancelled) bandLinks = links;
    })
    .catch(() => {
      if (!cancelled)
        bandLinksError =
          'Could not load saved release and band links. Please reopen the preview to try again.';
    });
  return () => {
    cancelled = true;
  };
});
let releaseTree = $derived(
  preview ?? createReleaseDetailsTree(new TreeData(), information),
);
let tracks = $derived(
  releaseTree.items.find((item) => item.label === 'Tracks'),
);
let tags = $derived([...new Set(information.tags)]);
let tabTree = $derived.by(() => {
  const data = new TreeData([], TREE_ITEM_LAYOUT.BROWSER);
  const currentReleaseUrl = releaseUrl?.toString();
  const artists = artistNames.map((name) => {
    const links = artistLinks(name);
    return {
      name,
      profiles: links.length
        ? links.map(bandPreviewItem)
        : [{ label: name, image: undefined, showArtwork: true }],
    };
  });
  data.add({
    label: 'Release Info',
    pathKey: 'release-info',
    image: ICON_INFO,
    hasChildren: true,
    showChildrenCount: false,
    children: releaseTree.items.filter(
      (item) => item !== tracks && item.label !== 'Credits',
    ),
  });
  data.add({
    label: 'Artists',
    pathKey: 'artists',
    image: ICON_MIC,
    hasChildren: true,
    childrenCount: artistNames.length,
    childrenLoaded: false,
    loadChildren: async () => ({
      children: (
        await Promise.all(
          artists.map(async ({ name, profiles }) => {
            const releases = await loadRelatedArtistReleases(
              [name],
              currentReleaseUrl,
            );
            return profiles.map((artist) => ({
              ...releases,
              ...artist,
              hasChildren: true,
              hint: `Browse other saved releases by ${name}.`,
            }));
          }),
        )
      ).flat(),
    }),
  });
  if (information.credits?.trim())
    data.add({
      label: 'Credits',
      pathKey: 'credits',
      image: ICON_FILE_TEXT,
      hasChildren: true,
      showChildrenCount: false,
    });
  data.add({
    ...(tracks ??
      items('Tracks', [text('No saved tracks for this release.')])
        .withoutChildrenCount()
        .build()),
    pathKey: 'tracks',
    image: ICON_LIST_MUSIC,
  });
  if (tags.length)
    data.add({
      label: 'Tags',
      pathKey: 'tags',
      image: ICON_TAGS,
      hasChildren: true,
      childrenCount: tags.length,
    });
  return data;
});
const emptyTree = new TreeData();
let releaseYear = $derived(
  information.releaseYear ??
    (information.date
      ? new Date(information.date).getUTCFullYear()
      : undefined),
);
let summary = $derived(
  [
    information.releaseType,
    information.tracks.length
      ? `${information.tracks.length} ${information.tracks.length === 1 ? 'track' : 'tracks'}`
      : undefined,
    information.duration,
  ].filter((value): value is string => !!value),
);
let dates = $derived(
  [
    { label: 'Released', value: information.date },
    { label: 'Modified', value: information.modifiedDate },
  ].flatMap(({ label, value }) => {
    if (!value) return [];
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? [{ label, value, dateTime: date.toISOString() }]
      : [];
  }),
);
</script>

{#snippet releaseActions()}
  {@render leadingActions?.()}
  <BcxPreviewItemActions url={releaseUrl} image={item.previewImage} name={`${information.artist} - ${information.title}`} kind="release" copyValue={`${information.artist} - ${information.title}`} releaseTitle={information.title} previewItem={item} keepInPreview={true} />
  {#if bandLinks.parent}
    <BcxPreviewItemActions url={bandLinks.parent.url} image={bandLinks.parent.image} name={bandLinks.parent.name} kind={bandLinks.publisher?.url.hasSameHostname(bandLinks.parent.url) ? 'label' : 'band'} copyValue={bandLinks.parent.name} previewItem={bandPreviewItem(bandLinks.parent)} />
  {/if}
{/snippet}

{#snippet releaseNotes()}
  {#if information.description}
    <div class="release-notes">
      <section aria-label="About this release"><h4>About this release</h4><p>{information.description}</p></section>
    </div>
  {/if}
{/snippet}

{#snippet releaseInfo()}
<BcxItemDetailsLayout
  image={item.previewImage}
  imageAlt={`Cover art for ${information.title}`}
  compactHeader={true}
  heading={information.title}
  headingSize={1.5}
  subheading={information.artist}
  subheadingSize={1.125}
  details={releaseNotes}
  fitContent={true}
  treeData={emptyTree}
  detailsLabel="Detailed release information"
>
  {#if releaseYear || summary.length}
    <div class="release-summary">
      {#if releaseYear}
        <span class="release-year">
          {#if information.date}
            <!-- svelte-ignore a11y_no_noninteractive_tabindex (allows keyboard access to the exact release date) -->
            <time datetime={information.date} tabindex="0" title={`Released on ${information.date}`} aria-label={`Released on ${information.date}`}>{releaseYear}</time>
          {:else}
            <span>{releaseYear}</span>
          {/if}
        </span>
      {/if}
      {#each summary as value, index}
        {#if releaseYear || index > 0}<span aria-hidden="true">·</span>{/if}
        <span>{value}</span>
      {/each}
    </div>
  {/if}
  {#if information.collectionStatus.length || information.price}
    <div class="release-badges">
      {#each information.collectionStatus as status}<span class="library-badge">{status}</span>{/each}
      {#if information.price}<span>{information.price}</span>{/if}
    </div>
  {/if}
  {#if dates.length}
    <dl class="release-dates">
      {#each dates as date}<div><dt>{date.label}</dt><dd><relative-time datetime={date.dateTime} format="relative" precision="day" title={date.value}>{date.value}</relative-time></dd></div>{/each}
    </dl>
  {/if}
</BcxItemDetailsLayout>
{/snippet}

{#snippet releasePanel(root: TreeItem)}
  {#if root.pathKey === 'release-info'}
    <div class="release-info-content bcx-info-scroll">{@render releaseInfo()}</div>
  {:else if root.pathKey === 'artists'}
    <BcxArtistsPanel {root} {onPreview} />
  {:else if root.pathKey === 'credits'}
    <div class="release-info-content">
      <section class="release-notes" aria-label="Release credits"><h4>Credits</h4><p>{information.credits}</p></section>
    </div>
  {:else if root.pathKey === 'tags'}
    <section class="release-info-content" aria-label="Release tags">
      <div class="release-tags">
        {#each tags as tag}
          <button type="button" class="tag" title={`Filter by ${tag}`} onclick={() => musicFilterStore.setSearchQuery(tag)}>{tag}</button>
        {/each}
      </div>
    </section>
  {:else}
    <BcxTreePanel {root} />
  {/if}
{/snippet}

{#snippet releasePanels()}
  {#if bandLinksError}<p class="band-links-error" role="alert">{bandLinksError}</p>{/if}
  {#if loading}<p class="release-status" role="status">Loading release details…</p>{/if}
  {#if error}<p class="band-links-error" role="alert">{error}</p>{/if}
  <div class="release-preview-tabs">
    <BcxRootSectionTabs treeData={tabTree} label="Release preview sections" sectionContent={releasePanel} responsiveSidebar={true} compactWhenOverflowing={true} countBadges={true} />
  </div>
{/snippet}

<div class="release-details">
  <div class="release-actions">
    <BcxSectionTabs tabs={[]} value="" label="Release actions" actions={releaseActions} wrapActions={true} />
  </div>
  {@render releasePanels()}
</div>

<style>
.release-actions { flex-shrink: 0; }
.release-actions :global(.bcx-section-tabs) { border-color: transparent; background: transparent; box-shadow: none; }
.release-details { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
.release-preview-tabs { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
.release-info-content { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow-y: auto; }
.release-notes { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 1rem 1rem; font-size: 0.8125rem; }
.release-notes h4 { margin: 0 0 0.375rem; font-size: 0.875rem; font-weight: 500; color: #e5e7eb; }
.release-notes p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; color: #d1d5db; }
.release-status { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; color: #9ca3af; }
.release-summary, .release-badges, .release-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; }
.release-tags { padding: 0.5rem 1rem 1rem; }
.release-summary { color: #9ca3af; }
.release-year time { position: relative; }
.release-year time:is(:hover, :focus)::after { content: attr(aria-label); position: absolute; top: calc(100% + 0.25rem); left: 0; z-index: 1; width: max-content; max-width: 14rem; padding: 0.375rem 0.5rem; border: 1px solid #4b5563; border-radius: 0.25rem; background: #111827; color: #e5e7eb; font-size: 0.75rem; pointer-events: none; }
.release-dates { display: flex; flex-wrap: wrap; gap: 0.375rem 1rem; margin: 0.5rem 0 0; font-size: 0.75rem; }
.release-dates div { display: flex; gap: 0.375rem; }
.release-dates dt { color: #9ca3af; }
.release-dates dd { margin: 0; color: #d1d5db; }
.band-links-error { margin: 0; padding: 0.5rem 1rem; color: #fca5a5; font-size: 0.8125rem; }
.release-badges { margin-top: 0.5rem; }
.library-badge { border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
.tag { padding: 0.125rem 0.375rem; border: 0; border-radius: 0.25rem; background: rgb(255 255 255 / 6%); color: #d1d5db; font-size: 0.75rem; cursor: pointer; }
.tag:hover { background: rgb(255 255 255 / 12%); color: #7dd3fc; }
.tag:focus-visible, time:focus-visible { outline: 1px solid #38bdf8; outline-offset: 2px; border-radius: 0.25rem; }
</style>
