<script lang="ts">
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type { BandPreview } from 'src/features/treeview/BandPreview';
import { copyToClipboard } from 'src/utils/clipboard';

let {
  information,
  loading,
  error,
}: { information: BandPreview; loading: boolean; error: string } = $props();
let feedback = $state('');
let actionError = $state('');

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
  feedback = '';
  actionError = '';
  try {
    await copyToClipboard(information.url);
    feedback = 'Band link copied.';
  } catch {
    actionError = 'Could not copy the band link. Please try again.';
  }
}
</script>

<div class="band-details">
  <header>
    {#if information.image}<img src={information.image} alt={`${information.name} profile`} onerror={(event) => event.currentTarget.setAttribute('hidden', '')} />{/if}
    <div><h3>{information.name}</h3>{#if information.location}<p>{information.location}</p>{/if}{#if information.following}<span class="badge">Following</span>{/if}</div>
  </header>
  <nav aria-label="Band actions">
    <a href={information.url} onclick={openLink}>Open on Bandcamp</a>
    <button type="button" onclick={copyLink}>Copy link</button>
  </nav>
  {#if feedback}<p role="status">{feedback}</p>{/if}
  {#if actionError}<p role="alert">{actionError}</p>{/if}
  {#if loading}<p role="status">Loading saved band details…</p>
  {:else if error}<p role="alert">{error}</p>
  {:else if !information.cached}<p>No saved band details yet. Open the band’s Bandcamp page to explore its catalog.</p>{/if}
  {#if information.cached}
    <p class="muted">Saved catalog: {information.albumCount} albums · {information.trackReleaseCount} track releases</p>
    {#if information.biography}<section aria-label="Band biography"><h4>About this band</h4><p class="biography">{information.biography}</p></section>{/if}
    {#if information.tags?.length}<div class="tags" aria-label="Genre tags">{#each information.tags as tag}<span class="badge">{tag}</span>{/each}</div>{/if}
    {#if information.links?.length}<nav aria-label="Band websites">{#each information.links as link}<a href={link.url} onclick={openLink}>{link.label}</a>{/each}</nav>{/if}
  {/if}
</div>

<style>
.band-details { padding: 0.75rem 1rem; font-size: 0.8125rem; overflow-wrap: anywhere; }
header { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem; }
header img { width: min(15rem, 50%); object-fit: contain; border-radius: 0.25rem; }
h3 { margin: 0 0 0.25rem; font-size: 0.875rem; }
h4 { margin: 0.75rem 0 0.25rem; }
p { margin: 0.5rem 0; }
nav, .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.625rem 0; }
a, button { color: #7dd3fc; }
a:hover, button:hover { text-decoration: underline; }
a:focus-visible, button:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
button { cursor: pointer; }
.badge { border-radius: 0.25rem; padding: 0.125rem 0.375rem; background: #293548; }
.muted { color: #d1d5db; }
.biography { white-space: pre-wrap; }
</style>
