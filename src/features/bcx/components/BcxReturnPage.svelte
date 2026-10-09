<script lang="ts">
import { Disc, ExternalLink, Music2, UserRound } from '@lucide/svelte';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type { PinnedPage } from 'src/features/bcx/pinnedNavigation';
import { loadPinnedPageImage } from 'src/features/bcx/pinnedPage';
import { console } from 'src/utils/console';
import { getErrorMessage } from 'src/utils/getErrorMessage';

let { page, visitTime }: { page: PinnedPage; visitTime?: string } = $props();
let savedImage = $state<string>();
let failedImage = $state<string>();
let error = $state('');
const image = $derived(page.image ?? savedImage);
const Icon = $derived(
  page.kind === 'band' ? UserRound : page.kind === 'release' ? Disc : Music2,
);

$effect(() => {
  const selected = page;
  savedImage = undefined;
  if (selected.image) return;
  let cancelled = false;
  void loadPinnedPageImage(selected).then(
    (value) => {
      if (!cancelled) savedImage = value;
    },
    (reason) =>
      console.warn('BCX: Could not load return-page artwork:', reason),
  );
  return () => {
    cancelled = true;
  };
});

async function openPage(event: MouseEvent) {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  )
    return;
  event.preventDefault();
  error = '';
  try {
    if (!(await openUrlInActiveTab(page.url))) window.location.assign(page.url);
  } catch (reason) {
    error = getErrorMessage(
      reason,
      'Could not open this page. Please try again.',
    );
  }
}
</script>

<li>
  <div class="return-row">
    <a class="page-link" href={page.url} title={`Open ${page.title} on Bandcamp\n${page.url}`} onclick={openPage}>
      <span class="artwork">
        {#if image && image !== failedImage}
          <img src={image} alt="" loading="lazy" onerror={() => { failedImage = image; }} />
        {:else}
          <Icon size={20} aria-hidden="true" />
        {/if}
      </span>
      <span class="identity">
        <span class="page-title">{page.title}</span>
        <span class="details">
          {#if page.artistName}<span class="artist">{page.artistName}</span>{:else}<span>{page.kind === 'band' ? 'Band' : page.kind === 'release' ? 'Release' : 'Track'}</span>{/if}
          {#if visitTime}
            <relative-time datetime={visitTime} format="relative" title={`Visited ${new Date(visitTime).toLocaleString()}`}>{new Date(visitTime).toLocaleString()}</relative-time>
          {/if}
        </span>
      </span>
    </a>
    <a class="new-tab" href={page.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${page.title} in a new tab`} title={`Open ${page.title} in a new tab`}><ExternalLink size={16} aria-hidden="true" /></a>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</li>

<style>
  li { border-bottom: 1px solid rgb(255 255 255 / 6%); }
  .return-row { display: flex; align-items: center; gap: 4px; padding: 4px 0; }
  .page-link { display: flex; align-items: center; flex: 1; min-width: 0; gap: 10px; padding: 6px; border-radius: 6px; color: inherit; text-decoration: none; }
  .page-link:hover, .new-tab:hover { background: rgb(255 255 255 / 8%); }
  a:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
  .artwork { display: flex; align-items: center; justify-content: center; flex: 0 0 36px; width: 36px; height: 36px; border-radius: 4px; overflow: hidden; background: rgb(255 255 255 / 6%); color: #9ca3af; }
  .artwork img { width: 100%; height: 100%; object-fit: cover; }
  .identity { display: grid; gap: 2px; min-width: 0; }
  .page-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.875rem; font-weight: 500; }
  .details { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; color: #9ca3af; font-size: 0.75rem; }
  .artist { overflow-wrap: anywhere; }
  relative-time { white-space: nowrap; }
  .new-tab { display: inline-flex; flex: 0 0 auto; padding: 4px; border-radius: 4px; color: #d1d5db; }
  .error { margin: 0 6px 6px; color: #fca5a5; font-size: 0.75rem; }
</style>
