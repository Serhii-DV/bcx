<script lang="ts">
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type {
  ReleaseInformation,
  ReleasePreview,
} from 'src/features/treeview/ReleasePreview';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { copyToClipboard } from 'src/utils/clipboard';
import { musicFilterStore } from '../stores/musicFilter';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

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
let feedback = $state('');
let actionError = $state('');
let expandedDescription = $state(false);
let artistHref = $derived(
  information.artistUrl ??
    `https://bandcamp.com/search?q=${encodeURIComponent(information.artist)}&item_type=b`,
);
let publisherHref = $derived(
  information.publisherUrl ??
    `https://bandcamp.com/search?q=${encodeURIComponent(information.publisher ?? '')}&item_type=b`,
);
let description = $derived(information.description ?? '');
let itemType = $derived(
  information.releaseType === 'Track' ? 'track' : 'release',
);

async function openLink(event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  if (!(event.currentTarget instanceof HTMLAnchorElement)) return;
  const url = event.currentTarget.href;
  event.preventDefault();
  actionError = '';
  try {
    if (!(await openUrlInActiveTab(url))) window.location.assign(url);
  } catch {
    actionError = 'Could not open the page. Please try again.';
  }
}

async function copyLink() {
  if (!item.href) return;
  feedback = '';
  actionError = '';
  try {
    await copyToClipboard(item.href);
    feedback = `${itemType === 'track' ? 'Track' : 'Release'} link copied.`;
  } catch {
    actionError = 'Could not copy the release link. Please try again.';
  }
}
</script>

<header class="release-header">
  {#if item.previewImage}
    <img class="release-cover" src={item.previewImage} alt={`Cover art for ${information.title}`} onerror={(event) => event.currentTarget.setAttribute('hidden', '')} />
  {/if}
  <div class="release-heading">
    <h3>{information.title}</h3>
    <a href={artistHref} onclick={openLink}>{information.artist}</a>
    {#if information.publisher}
      <div class="muted">Label: <a href={publisherHref} onclick={openLink}>{information.publisher}</a></div>
    {/if}
    {#if information.date || information.releaseType || information.duration}
      <div class="muted">
        {#if information.date}<time datetime={information.date}>{information.date}</time>{/if}
        {#if information.date && information.releaseType} · {/if}{information.releaseType ?? ''}
        {#if information.duration && information.releaseType === 'Track'} · {information.duration}{/if}
      </div>
    {/if}
  </div>
</header>
<div class="release-details">
  {#if information.collectionStatus.length || information.price}
    <div class="badges">
      {#each information.collectionStatus as status}<span class="badge" title="Based on your saved Bandcamp lists">{status}</span>{/each}
      {#if information.price}<span class="price">{information.price}</span>{/if}
    </div>
  {/if}
  <nav class="quick-actions" aria-label={`${itemType === 'track' ? 'Track' : 'Release'} actions`}>
    {#if item.href}
      <a href={item.href} onclick={openLink}>Open on Bandcamp</a>
      <button type="button" onclick={copyLink}>Copy link</button>
    {/if}
    <a href={artistHref} onclick={openLink}>Explore artist</a>
  </nav>
  {#if feedback}<p role="status">{feedback}</p>{/if}
  {#if actionError}<p role="alert">{actionError}</p>{/if}
  {#if information.tags.length}
    <div class="tags" aria-label="Genre tags">
      {#each information.tags as tag}
        <button type="button" title={`Filter releases by ${tag}`} onclick={() => musicFilterStore.setSearchQuery(tag)}>{tag}</button>
      {/each}
    </div>
  {/if}
  {#if loading}<p role="status" class="muted">Loading {itemType} details…</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
  {#if information.tracks.length}
    <details>
      <summary>Tracklist ({information.tracks.length}){#if information.duration} · {information.duration}{/if}</summary>
      <ol class="tracks">
        {#each information.tracks as track}
          <li>
            <span class="muted">{track.position}.</span>
            {#if track.url}<a href={track.url} onclick={openLink}>{track.title}</a>{:else}<span>{track.title}</span>{/if}
            {#if track.duration}<span class="duration">{track.duration}</span>{/if}
          </li>
        {/each}
      </ol>
    </details>
  {/if}
  {#if description}
    <section aria-label={`${itemType === 'track' ? 'Track' : 'Release'} description`}>
      <h4>About this {itemType}</h4>
      <p class="release-notes">{expandedDescription || description.length <= 240 ? description : `${description.slice(0, 240).trimEnd()}…`}</p>
      {#if description.length > 240}
        <button type="button" aria-expanded={expandedDescription} onclick={() => { expandedDescription = !expandedDescription; }}>{expandedDescription ? 'Show less' : 'Show more'}</button>
      {/if}
    </section>
  {/if}
  {#if information.credits}
    <details><summary>Credits</summary><p class="release-notes">{information.credits}</p></details>
  {/if}
  {#if preview}
    <details>
      <summary>More details and actions</summary>
      <div class="additional-details">
        <BcxTreeBrowser treeData={preview} nativeTabNavigation={true} showBreadcrumb={false} showFilter={false} />
      </div>
    </details>
  {/if}
</div>

<style>
.release-header { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 1rem; flex-shrink: 0; }
.release-cover { width: 15rem; height: 15rem; object-fit: contain; border-radius: 0.25rem; flex-shrink: 0; }
.release-heading { min-width: 0; overflow-wrap: anywhere; font-size: 0.75rem; }
h3 { margin: 0 0 0.25rem; font-size: 0.875rem; }
h4 { margin: 0.75rem 0 0.25rem; font-size: 0.8125rem; }
.release-details { min-height: 0; overflow-y: auto; padding: 0 1rem 0.75rem; font-size: 0.8125rem; }
.muted, .duration { color: #d1d5db; }
a, button { color: #7dd3fc; }
a:hover, button:hover { text-decoration: underline; }
a:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
button, summary { cursor: pointer; }
.badges, .quick-actions, .tags { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 0.625rem; }
.badge, .tags button { border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; }
.badge { color: #a7f3d0; }
.price { color: #e5e7eb; }
details { border-top: 1px solid #374151; padding: 0.5rem 0; }
summary { font-weight: 600; }
.tracks { list-style: none; padding: 0; margin: 0.5rem 0; }
.tracks li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 0.5rem; padding: 0.25rem 0; overflow-wrap: anywhere; }
.duration { font-variant-numeric: tabular-nums; white-space: nowrap; }
.release-notes { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0.5rem 0; }
.additional-details { display: flex; flex-direction: column; height: 16rem; min-height: 0; }
</style>
