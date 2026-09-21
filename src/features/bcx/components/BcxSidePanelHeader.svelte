<script lang="ts">
import { X } from '@lucide/svelte';
import iconUrl from 'src/assets/icons/icon-48.png';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type { SidePanelHeader } from 'src/features/bcx/sidePanelHeader';

interface Props {
  header?: SidePanelHeader | null;
  showCloseButton?: boolean;
  onClose?: () => void;
}

let {
  header = null,
  showCloseButton = false,
  onClose = () => {},
}: Props = $props();
let bandLinkError = $state('');
let failedBandImageUrl = $state<string | undefined>();
let failedPageImageUrl = $state<string | undefined>();
const pageImageUrl = $derived(
  header?.imageUrl && header.imageUrl !== failedPageImageUrl
    ? header.imageUrl
    : iconUrl,
);

async function openBandPage(event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  if (!(event.currentTarget instanceof HTMLAnchorElement)) return;

  const href = event.currentTarget.href;
  event.preventDefault();
  bandLinkError = '';

  try {
    if (!(await openUrlInActiveTab(href))) window.location.assign(href);
  } catch {
    bandLinkError = 'Could not open the band page. Please try again.';
  }
}
</script>

<header class="bcx-side-panel-header">
  <div class="bcx-header-context">
    <div class="bcx-header-page">
      <img
        src={pageImageUrl}
        alt={pageImageUrl === iconUrl ? 'BCX' : ''}
        class="h-10 w-10 shrink-0 rounded object-cover"
        onerror={() => { failedPageImageUrl = header?.imageUrl; }}
      />
      <div class="min-w-0">
        <h2 class="truncate text-lg font-semibold" title={header?.title ?? 'Music Explorer'}>{header?.title ?? 'Music Explorer'}</h2>
        {#if header?.subtitle}
          <p class="truncate text-sm text-gray-300" title={header.subtitle}>{header.subtitle}</p>
        {/if}
      </div>
    </div>

    {#if header?.band}
      <div class="bcx-header-band">
        <a
          class="bcx-header-band-link"
          href={header.band.href}
          onclick={openBandPage}
          title={`Go to ${header.band.name}`}
        >
          <img
            src={header.band.imageUrl && header.band.imageUrl !== failedBandImageUrl ? header.band.imageUrl : iconUrl}
            alt=""
            class="h-8 w-8 shrink-0 rounded object-cover"
            onerror={() => { failedBandImageUrl = header?.band?.imageUrl; }}
          />
          <span class="min-w-0">
            <span class="block text-xs text-gray-300">Back to band / label</span>
            <span class="block truncate text-sm font-semibold">{header.band.name}</span>
          </span>
        </a>
        {#if bandLinkError}<p role="alert" class="mt-1 text-sm">{bandLinkError}</p>{/if}
      </div>
    {/if}
  </div>

  {#if showCloseButton}
    <button
      type="button"
      class="bcx-side-panel-close-button"
      aria-label="Close BCX side panel"
      title="Close side panel"
      onclick={onClose}
    >
      <X size="20" />
    </button>
  {/if}
</header>

<style>
  .bcx-side-panel-header {
    align-items: center;
    display: flex;
    flex-shrink: 0;
    gap: 0.5rem;
    padding: 1rem;
  }

  .bcx-header-context {
    display: grid;
    flex: 1;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr));
    min-width: 0;
  }

  .bcx-header-page,
  .bcx-header-band-link {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    min-width: 0;
  }

  .bcx-header-band {
    min-width: 0;
  }

  .bcx-header-band-link {
    border-radius: 0.375rem;
    color: inherit;
    padding: 0.375rem;
    text-decoration: none;
  }

  .bcx-header-band-link:hover,
  .bcx-header-band-link:focus-visible {
    background: rgb(255 255 255 / 12%);
    color: #04b1fe;
  }

  .bcx-side-panel-close-button {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 6px;
    color: #f9fafb;
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 32px;
    justify-content: center;
    padding: 0;
    transition:
      background-color 160ms ease,
      color 160ms ease;
    width: 32px;
  }

  .bcx-side-panel-close-button:hover,
  .bcx-side-panel-close-button:focus-visible {
    background: rgb(255 255 255 / 12%);
    color: #04b1fe;
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .bcx-side-panel-close-button {
      transition: none;
    }
  }
</style>
