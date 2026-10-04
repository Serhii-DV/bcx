<script lang="ts">
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import {
  createReleaseDetailsTree,
  type ReleaseInformation,
  type ReleasePreview,
} from 'src/features/treeview/ReleasePreview';
import { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { musicFilterStore } from '../stores/musicFilter';
import BcxItemDetailsLayout from './BcxItemDetailsLayout.svelte';
import BcxPreviewActions from './BcxPreviewActions.svelte';
import BcxPreviewLink from './BcxPreviewLink.svelte';
import { createItemUrl } from './itemUrl';

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
let releaseUrl = $derived(createItemUrl(item.href));
let publisherUrl = $derived(createItemUrl(information.publisherUrl));
let artistUrl = $derived.by(() => {
  const savedUrl = createItemUrl(information.artistUrl);
  if (savedUrl) return savedUrl;
  // A label-hosted release does not establish the artist's own Bandcamp URL.
  if (
    releaseUrl &&
    (!information.publisher ||
      information.publisher.toLowerCase() === information.artist.toLowerCase())
  ) {
    return BandcampUrlFactory.createBandUrl(releaseUrl);
  }
  return createItemUrl(
    `https://bandcamp.com/search?q=${encodeURIComponent(information.artist)}&item_type=b`,
  );
});
let distinctPublisher = $derived(
  !!information.publisher &&
    information.publisher.toLowerCase() !== information.artist.toLowerCase() &&
    (!publisherUrl || !artistUrl || !publisherUrl.hasSameHostname(artistUrl)),
);
let labelUrl = $derived(
  publisherUrl ??
    createItemUrl(
      `https://bandcamp.com/search?q=${encodeURIComponent(information.publisher ?? '')}&item_type=b`,
    ),
);
let treeData = $derived(
  preview ?? createReleaseDetailsTree(new TreeData(), information, item.href),
);
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
let expandedTags = $state(false);
const componentId = $props.id();
const tagsId = `${componentId}-tags`;
let tags = $derived([...new Set(information.tags)]);
let visibleTags = $derived(expandedTags ? tags : tags.slice(0, 3));
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
</script>

{#snippet artistHeading()}
  {#if artistUrl}
    <BcxPreviewLink url={artistUrl} name={information.artist} plain={true} title={`Explore artist on Bandcamp: ${information.artist}`} />
  {:else}
    {information.artist}
  {/if}
{/snippet}

<BcxItemDetailsLayout
  image={item.previewImage}
  imageAlt={`Cover art for ${information.title}`}
  heading={information.title}
  subheadingContent={artistHeading}
  {treeData}
  detailsLabel="Detailed release information"
  {loading}
  loadingMessage="Loading release details…"
  {error}
>
  {#if releaseYear || summary.length}
    <div class="release-summary">
      {#if releaseYear}
        {#if information.date}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex (allows keyboard access to the exact release date) -->
          <time datetime={information.date} tabindex="0" title={`Released on ${information.date}`} aria-label={`Released on ${information.date}`}>{releaseYear}</time>
        {:else}
          <span>{releaseYear}</span>
        {/if}
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
  {#if tags.length}
    <div class="release-tags">
      <div id={tagsId} class="tag-list">
        {#each visibleTags as tag}
          <button type="button" class="tag" title={`Filter by ${tag}`} onclick={() => musicFilterStore.setSearchQuery(tag)}>{tag}</button>
        {/each}
      </div>
      {#if tags.length > 3}
        <button type="button" class="more-tags" aria-expanded={expandedTags} aria-controls={tagsId} onclick={() => { expandedTags = !expandedTags; }}>{expandedTags ? 'Show fewer tags' : `+${tags.length - 3} more`}</button>
      {/if}
    </div>
  {/if}
  {#if distinctPublisher && labelUrl}
    <div class="release-label">Label: <BcxPreviewLink url={labelUrl} name={information.publisher} plain={true} title={`Explore label on Bandcamp: ${information.publisher}`} /></div>
  {/if}
  <div class="release-actions">
    {#if releaseUrl}<BcxPreviewLink url={releaseUrl} name="Open on Bandcamp" plain={true} title={`Open release on Bandcamp: ${information.title} by ${information.artist}`} />{/if}
    <BcxPreviewActions label="More release actions" items={copyItems} />
  </div>
</BcxItemDetailsLayout>

<style>
.release-summary, .release-actions, .release-badges, .release-tags, .tag-list { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; }
.release-summary { color: #9ca3af; }
time { position: relative; }
time:is(:hover, :focus)::after { content: attr(aria-label); position: absolute; top: calc(100% + 0.25rem); left: 0; z-index: 1; width: max-content; max-width: 14rem; padding: 0.375rem 0.5rem; border: 1px solid #4b5563; border-radius: 0.25rem; background: #111827; color: #e5e7eb; font-size: 0.75rem; pointer-events: none; }
.release-badges, .release-tags, .release-label, .release-actions { margin-top: 0.5rem; }
.library-badge { border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; color: #a7f3d0; }
.tag { padding: 0.125rem 0.375rem; border: 0; border-radius: 0.25rem; background: rgb(255 255 255 / 6%); color: #d1d5db; font-size: 0.75rem; cursor: pointer; }
.tag:hover { background: rgb(255 255 255 / 12%); color: #7dd3fc; }
.more-tags { padding: 0; border: 0; background: transparent; color: #7dd3fc; font-size: 0.75rem; cursor: pointer; }
.release-label { color: #9ca3af; }
.tag:focus-visible, .more-tags:focus-visible, time:focus-visible { outline: 1px solid #38bdf8; outline-offset: 2px; border-radius: 0.25rem; }
</style>
