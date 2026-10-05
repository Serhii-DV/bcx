<script lang="ts">
import { loadReleaseBandLinks } from 'src/features/treeview/BandPreview';
import {
  createReleaseDetailsTree,
  type ReleaseInformation,
  type ReleasePreview,
} from 'src/features/treeview/ReleasePreview';
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { items, text } from 'src/features/treeview/TreeItemBuilder';
import {
  ICON_INFO,
  ICON_LIST_MUSIC,
  ICON_TAGS,
} from 'src/features/treeview/utils/icon';
import { musicFilterStore } from '../stores/musicFilter';
import BcxItemDetailsLayout from './BcxItemDetailsLayout.svelte';
import BcxPreviewActions from './BcxPreviewActions.svelte';
import BcxPreviewLink from './BcxPreviewLink.svelte';
import BcxReleaseSearch from './BcxReleaseSearch.svelte';
import BcxReleaseTreePanel from './BcxReleaseTreePanel.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import { createItemUrl } from './itemUrl';

let {
  item,
  information,
  preview,
  loading,
  error,
  onPreview,
}: {
  item: TreeItem;
  information: ReleaseInformation;
  preview: ReleasePreview | null;
  loading: boolean;
  error: string;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
} = $props();
let releaseUrl = $derived(createItemUrl(item.href));
let bandLinks = $state<Awaited<ReturnType<typeof loadReleaseBandLinks>>>({
  artists: [],
  releases: [],
});
let bandLinksError = $state('');
$effect(() => {
  const currentInformation = information;
  const currentUrl = releaseUrl;
  let cancelled = false;
  bandLinks = { artists: [], releases: [] };
  bandLinksError = '';
  void loadReleaseBandLinks(currentInformation, currentUrl)
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
  preview ?? createReleaseDetailsTree(new TreeData(), information, item.href),
);
let tracks = $derived(
  releaseTree.items.find((item) => item.label === 'Tracks'),
);
let relatedReleases = $derived(
  releaseTree.items.find((item) => item.label === 'Related releases'),
);
let tags = $derived([...new Set(information.tags)]);
let tabTree = $derived.by(() => {
  const data = new TreeData([], TREE_ITEM_LAYOUT.BROWSER);
  data.add({
    label: 'Release Info',
    pathKey: 'release-info',
    image: ICON_INFO,
    hasChildren: true,
    showChildrenCount: false,
    children: releaseTree.items.filter(
      (item) => item !== tracks && item !== relatedReleases,
    ),
  });
  data.add({
    ...(tracks ??
      items('Tracks', [text('No saved tracks for this release.')])
        .withoutChildrenCount()
        .build()),
    pathKey: 'tracks',
    image: ICON_LIST_MUSIC,
  });
  if (relatedReleases)
    data.add({
      ...relatedReleases,
      pathKey: 'related-releases',
      showChildrenCount: false,
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
let copyItems = $derived([
  { label: 'Copy artist name', value: information.artist },
  { label: 'Copy release title', value: information.title },
  {
    label: 'Copy full title',
    value: `${information.artist} - ${information.title}`,
  },
  ...(releaseUrl
    ? [{ label: 'Copy release URL', value: releaseUrl.toString() }]
    : []),
]);
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
  {#if releaseUrl}<BcxPreviewLink url={releaseUrl} image={item.previewImage} name="Release" toolbar={true} title={`Open release on Bandcamp: ${information.title} by ${information.artist}`} />{/if}
  {#each bandLinks.artists as artist (artist.url.toString())}
    <BcxPreviewLink url={artist.url} image={artist.image} name={artist.name} toolbar={true} title={`Open artist on Bandcamp: ${artist.name}`} />
  {/each}
  {#if bandLinks.publisher}
    <BcxPreviewLink url={bandLinks.publisher.url} image={bandLinks.publisher.image} name={bandLinks.publisher.name} toolbar={true} title={`Open label on Bandcamp: ${bandLinks.publisher.name}`} />
  {/if}
  {#each bandLinks.releases as release (release.url.toString())}
    <BcxPreviewLink url={release.url} image={release.image} name={`Release on ${release.name}`} toolbar={true} title={`Open ${information.title} on ${release.name}’s Bandcamp page`} />
  {/each}
  <BcxReleaseSearch artist={information.artist} title={information.title} />
  <BcxPreviewActions label="Copy release details" items={copyItems} />
{/snippet}

{#snippet releaseNotes()}
  {#if information.description || information.credits}
    <div class="release-notes">
      {#if information.description}<section aria-label="About this release"><h4>About this release</h4><p>{information.description}</p></section>{/if}
      {#if information.credits}<section aria-label="Release credits"><h4>Credits</h4><p>{information.credits}</p></section>{/if}
    </div>
  {/if}
{/snippet}

{#snippet releaseInfo()}
<BcxItemDetailsLayout
  image={item.previewImage}
  imageAlt={`Cover art for ${information.title}`}
  imageScale={1.2}
  heading={information.title}
  headingSize={1.75}
  subheading={information.artist}
  subheadingSize={2.2}
  details={releaseNotes}
  fitContent={true}
  treeData={emptyTree}
  detailsLabel="Detailed release information"
>
  {#if releaseYear}
    <div class="release-year">
      {#if information.date}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex (allows keyboard access to the exact release date) -->
        <time datetime={information.date} tabindex="0" title={`Released on ${information.date}`} aria-label={`Released on ${information.date}`}>{releaseYear}</time>
      {:else}
        <span>{releaseYear}</span>
      {/if}
    </div>
  {/if}
  {#if summary.length}
    <div class="release-summary">
      {#each summary as value, index}
        {#if index > 0}<span aria-hidden="true">·</span>{/if}
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
    <div class="release-info-content">{@render releaseInfo()}</div>
  {:else if root.pathKey === 'tags'}
    <section class="release-info-content" aria-label="Release tags">
      <div class="release-tags">
        {#each tags as tag}
          <button type="button" class="tag" title={`Filter by ${tag}`} onclick={() => musicFilterStore.setSearchQuery(tag)}>{tag}</button>
        {/each}
      </div>
    </section>
  {:else}
    <BcxReleaseTreePanel {root} onPreview={root.pathKey === 'related-releases' ? onPreview : undefined} />
  {/if}
{/snippet}

{#snippet releasePanels()}
  {#if bandLinksError}<p class="band-links-error" role="alert">{bandLinksError}</p>{/if}
  {#if loading}<p class="release-status" role="status">Loading release details…</p>{/if}
  {#if error}<p class="band-links-error" role="alert">{error}</p>{/if}
  <div class="release-preview-tabs">
    <BcxRootSectionTabs treeData={tabTree} label="Release preview sections" sectionContent={releasePanel} responsiveSidebar={true} />
  </div>
{/snippet}

<div class="release-details">
  <BcxSectionTabs tabs={[]} value="" label="Release actions" actions={releaseActions} wrapActions={true} />
  {@render releasePanels()}
</div>

<style>
.release-details { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
.release-preview-tabs { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
.release-info-content { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow-y: auto; }
.release-notes { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 1rem 1rem; font-size: 0.8125rem; }
.release-notes h4 { margin: 0 0 0.375rem; font-size: 0.875rem; font-weight: 500; color: #e5e7eb; }
.release-notes p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; color: #d1d5db; }
.release-status { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; color: #9ca3af; }
.release-summary, .release-badges, .release-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; }
.release-tags { padding: 0.5rem 1rem 1rem; }
.release-year { margin-bottom: 0.5rem; font-size: 1.75rem; font-weight: 300; line-height: 1.2; letter-spacing: 0.01em; }
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
