<script lang="ts">
import { Check, ChevronDown, Copy, ExternalLink, Eye } from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type { Url } from 'src/core/url';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BandcampIcon from 'src/lib/components/BandcampIcon.svelte';
import { copyToClipboard } from 'src/utils/clipboard';
import { onDestroy } from 'svelte';
import { getItemPreviewContext } from '../stores/itemPreview';

let {
  url,
  image,
  name,
  kind,
  copyValue,
  releaseTitle,
  previewItem,
  keepInPreviewTab = false,
}: {
  url?: Url;
  image?: string;
  name: string;
  kind: 'release' | 'artist' | 'label' | 'band';
  copyValue: string;
  releaseTitle?: string;
  previewItem?: TreeItem;
  keepInPreviewTab?: boolean;
} = $props();
const preview = getItemPreviewContext();
let container = $state<HTMLDivElement>();
let failedImage = $state<string>();
let copied = $state(false);
let error = $state('');
let previewSelected = $state(false);
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
let destroyed = false;
let actionTitle = $derived(
  `${kind[0].toUpperCase()}${kind.slice(1)} actions: ${name}`,
);
let copyLabel = $derived(
  kind === 'release' ? 'Copy full release title' : `Copy ${kind} name`,
);
let pageUrl = $derived(url?.toString());
let copyItems = $derived([
  { label: copyLabel, value: copyValue },
  ...(kind === 'release' && releaseTitle
    ? [{ label: 'Copy release title', value: releaseTitle }]
    : []),
  ...(pageUrl
    ? [
        {
          label: kind === 'band' ? 'Copy URL' : `Copy ${kind} URL`,
          value: pageUrl,
        },
      ]
    : []),
]);
let previewLabel = $derived(
  keepInPreviewTab ? 'Keep in preview tab' : `Preview ${kind}`,
);
let search = $derived.by(() => {
  if (!copyValue.trim()) return undefined;
  return {
    label: `Search ${kind}`,
    query: copyValue,
    url: `https://bandcamp.com/search?q=${encodeURIComponent(copyValue)}&item_type=${kind === 'release' ? 'a' : 'b'}`,
  };
});

onDestroy(() => {
  destroyed = true;
  clearTimeout(feedbackTimer);
});

async function openPage(event: MouseEvent, destination: string) {
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
    if (!(await openUrlInActiveTab(destination)))
      window.location.assign(destination);
  } catch {
    if (!destroyed) error = 'Could not open the page. Please try again.';
  }
}

async function copy(value: string) {
  clearTimeout(feedbackTimer);
  copied = false;
  error = '';
  try {
    await copyToClipboard(value);
    if (destroyed) return;
    copied = true;
    feedbackTimer = setTimeout(() => {
      copied = false;
    }, 1800);
  } catch {
    if (!destroyed) error = 'Could not copy. Please try again.';
  }
}
</script>

<div bind:this={container} class="preview-item-actions">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="bcx-section-tab" aria-label={actionTitle} title={`${actionTitle}\n${copyValue}${pageUrl ? `\n${pageUrl}` : ''}`}>
      {#if copied}
        <Check size={14} class="shrink-0 text-emerald-300" aria-hidden="true" />
      {:else if image && image !== failedImage}
        <img src={image} alt="" class="item-image" onerror={() => { failedImage = image; }} />
      {/if}
      <span class="item-name">{name}</span>
      <ChevronDown size={14} class="shrink-0" aria-hidden="true" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal to={container?.closest('.bcx-side-panel-shell') ?? undefined}>
      <DropdownMenu.Content class="preview-item-menu" align="start" sideOffset={4} strategy="fixed" onCloseAutoFocus={(event) => { if (previewSelected) { event.preventDefault(); previewSelected = false; } }}>
        {#if pageUrl}
          {@const destination = pageUrl}
          <DropdownMenu.Item class="preview-item-menu-action" title={destination}>
            {#snippet child({ props })}
              <a {...props} href={destination} onclick={(event) => { if (typeof props.onclick === 'function') props.onclick(event); void openPage(event, destination); }}>
                <BandcampIcon size={14} class="shrink-0" aria-hidden="true" />
                <span class="action-text"><span>Open on Bandcamp</span><span class="action-value">{destination}</span></span>
                <ExternalLink size={12} class="shrink-0" aria-hidden="true" />
              </a>
            {/snippet}
          </DropdownMenu.Item>
        {/if}
        {#if preview && previewItem}
          <DropdownMenu.Item class="preview-item-menu-action" onSelect={() => { if (previewItem) { previewSelected = true; preview.show(previewItem); } }}>
            <Eye size={14} class="shrink-0" aria-hidden="true" />
            <span>{previewLabel}</span>
          </DropdownMenu.Item>
        {/if}
        {#if pageUrl || (preview && previewItem)}
          <DropdownMenu.Separator class="preview-item-menu-separator" />
        {/if}
        {#each copyItems as item (item.label)}
          <DropdownMenu.Item class="preview-item-menu-action" title={item.value} onSelect={() => { void copy(item.value); }}>
            <Copy size={14} class="shrink-0" aria-hidden="true" />
            <span class="action-text"><span>{item.label}</span><span class="action-value">{item.value}</span></span>
          </DropdownMenu.Item>
        {/each}
        {#if search}
          {@const option = search}
          <DropdownMenu.Separator class="preview-item-menu-separator" />
          <DropdownMenu.Item class="preview-item-menu-action" title={`Search Bandcamp for ${option.query}\n${option.url}`}>
            {#snippet child({ props })}
              <a {...props} href={option.url} onclick={(event) => { if (typeof props.onclick === 'function') props.onclick(event); void openPage(event, option.url); }}>
                <BandcampIcon size={14} class="shrink-0" aria-hidden="true" />
                <span class="action-text"><span>{option.label}</span><span class="action-value">{option.query}</span></span>
                <ExternalLink size={12} class="shrink-0" aria-hidden="true" />
              </a>
            {/snippet}
          </DropdownMenu.Item>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
  <span role="status" class="sr-only">{copied ? 'Copied' : ''}</span>
  {#if error}<span role="alert">{error}</span>{/if}
</div>

<style>
.preview-item-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; min-width: 0; max-width: 100%; }
.item-image { width: 1rem; height: 1rem; flex-shrink: 0; border-radius: 0.125rem; object-fit: cover; }
.item-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:global(.preview-item-menu) { z-index: 1000000; max-width: min(20rem, calc(100vw - 24px)); max-height: var(--bits-dropdown-menu-content-available-height); overflow-y: auto; padding: 0.25rem; border: 1px solid #4b5563; border-radius: 0.375rem; background: #111827; color: #f9fafb; box-shadow: 0 4px 12px rgb(0 0 0 / 25%); }
:global(.preview-item-menu-action) { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.8125rem; cursor: pointer; }
:global(.preview-item-menu-action[data-highlighted]) { background: #293548; outline: none; }
:global(.preview-item-menu-separator) { height: 1px; margin: 0.25rem; background: #4b5563; }
.action-text { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 0.125rem; }
.action-value { color: #9ca3af; font-size: 0.75rem; overflow-wrap: anywhere; white-space: pre-wrap; }
[role='alert'] { color: #fca5a5; font-size: 0.75rem; }
</style>
