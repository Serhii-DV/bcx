<script lang="ts">
import { ExternalLink } from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { openUrlInActiveTab } from 'src/core/extensionActions';

let { artist, title }: { artist: string; title: string } = $props();
let container = $state<HTMLDivElement>();
let error = $state('');
let searches = $derived(
  [
    { label: 'Search artist', query: artist, type: 'b' },
    { label: 'Search release', query: `${artist} - ${title}`, type: 'a' },
  ].map((search) => ({
    ...search,
    url: `https://bandcamp.com/search?q=${encodeURIComponent(search.query)}&item_type=${search.type}`,
  })),
);

async function openSearch(event: MouseEvent, url: string) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  error = '';
  try {
    if (!(await openUrlInActiveTab(url))) window.location.assign(url);
  } catch {
    error = 'Could not open Bandcamp search. Please try again.';
  }
}
</script>

<div bind:this={container} class="release-search">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="bcx-section-tab" aria-label="Search Bandcamp" title="Search Bandcamp">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="shrink-0"><path d="M0 18.6 7.2 5.4H24l-7.2 13.2Z" /></svg>
      Search
      <ExternalLink size={12} class="shrink-0" aria-hidden="true" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal to={container?.closest('.bcx-side-panel-shell') ?? undefined}>
      <DropdownMenu.Content class="bcx-section-overflow" align="start" sideOffset={4} strategy="fixed">
        {#each searches as search}
          <DropdownMenu.Item class="bcx-section-menu-item" title={`Search Bandcamp for ${search.query}\n${search.url}`}>
            {#snippet child({ props })}
              <a {...props} href={search.url} onclick={(event) => { if (typeof props.onclick === 'function') props.onclick(event); void openSearch(event, search.url); }}>
                <span class="search-option"><span>{search.label}</span><span class="search-query">{search.query}</span></span>
                <ExternalLink size={12} class="shrink-0" aria-hidden="true" />
              </a>
            {/snippet}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
  {#if error}<span role="alert">{error}</span>{/if}
</div>

<style>
.release-search { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; }
.search-option { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 0.125rem; }
.search-query { color: #9ca3af; font-size: 0.75rem; overflow-wrap: anywhere; }
[role='alert'] { color: #fca5a5; font-size: 0.75rem; }
</style>
