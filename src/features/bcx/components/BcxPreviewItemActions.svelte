<script lang="ts">
import {
  Check,
  ChevronDown,
  Copy,
  Disc,
  Ellipsis,
  ExternalLink,
  Eye,
  Pin,
  Search,
} from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type { Url } from 'src/core/url';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BandcampIcon from 'src/lib/components/BandcampIcon.svelte';
import { copyToClipboard } from 'src/utils/clipboard';
import { onDestroy, type Snippet } from 'svelte';
import { createPinnedPage, samePinnedPage } from '../pinnedNavigation';
import { pinnedPageFromItem } from '../pinnedPage';
import { getItemPreviewContext } from '../stores/itemPreview';
import { changePin, pinnedNavigation } from '../stores/pinnedNavigation';
import BcxPinButton from './BcxPinButton.svelte';

let {
  url,
  image,
  name,
  kind,
  copyValue,
  releaseTitle,
  previewItem,
  keepInPreview = false,
  iconOnly = false,
  toolbar = false,
  variant = 'menu',
  menuLabel,
  relatedActions,
}: {
  url?: Url;
  image?: string;
  name: string;
  kind: 'release' | 'artist' | 'label' | 'band';
  copyValue: string;
  releaseTitle?: string;
  previewItem?: TreeItem;
  keepInPreview?: boolean;
  iconOnly?: boolean;
  toolbar?: boolean;
  variant?: 'menu' | 'toolbar';
  menuLabel?: string;
  relatedActions?: Snippet;
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
const toolbarLabel = $derived(`${kind[0].toUpperCase()}${kind.slice(1)}`);
let copyLabel = $derived(
  kind === 'release' ? 'Copy full release title' : `Copy ${kind} name`,
);
let pageUrl = $derived(url?.toString());
let pinPage = $derived(
  pinnedPageFromItem(previewItem) ??
    (pageUrl
      ? createPinnedPage(pageUrl, name, undefined, undefined, image)
      : undefined),
);
let savedPin = $derived(
  pinPage &&
    $pinnedNavigation.items.find((page) => samePinnedPage(page, pinPage)),
);
let pinSaving = $state(false);

async function pinPageFromMenu() {
  if (!pinPage || pinSaving) return;
  pinSaving = true;
  error = '';
  try {
    await changePin(
      savedPin
        ? { action: 'unpin', page: savedPin }
        : { action: 'pin', page: pinPage },
    );
  } catch {
    if (!destroyed) error = 'Could not save this pin. Please try again.';
  } finally {
    if (!destroyed) pinSaving = false;
  }
}
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
  keepInPreview ? 'Keep in Preview' : `Preview ${kind}`,
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

{#snippet copyMenuItems()}
  {#each copyItems as item (item.label)}
    <DropdownMenu.Item class="preview-item-menu-action" title={item.value} onSelect={() => { void copy(item.value); }}>
      <Copy size={14} class="shrink-0" aria-hidden="true" />
      <span class="action-text"><span>{item.label}</span><span class="action-value">{item.value}</span></span>
    </DropdownMenu.Item>
  {/each}
{/snippet}

{#snippet searchMenuItems()}
  {#if search}
    {@const option = search}
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
{/snippet}

<div bind:this={container} class="preview-item-actions" class:toolbar class:named-title={!toolbar && (kind === 'band' || (kind === 'release' && keepInPreview))}>
  {#if variant === 'toolbar'}
    {#if pageUrl}
      {@const destination = pageUrl}
      <a class="bcx-section-tab" href={destination} title={`Open ${name} on Bandcamp\n${destination}`} onclick={(event) => void openPage(event, destination)}>
        <BandcampIcon size={16} class="shrink-0" aria-hidden="true" /><span>Open</span><ExternalLink size={12} class="shrink-0" aria-hidden="true" />
      </a>
    {/if}
    {#if pinPage}<BcxPinButton page={pinPage} toolbar={true} />{/if}
    {@render relatedActions?.()}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="bcx-section-tab" aria-label={`Copy ${kind} details: ${name}`} title={`Copy ${kind} details: ${name}`}>
        {#if copied}<Check size={16} class="shrink-0 text-emerald-300" aria-hidden="true" />{:else}<Copy size={16} aria-hidden="true" />{/if}
        <span>Copy</span><ChevronDown size={14} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal to={container?.closest('.bcx-side-panel-shell') ?? undefined}>
        <DropdownMenu.Content class="preview-item-menu" align="start" sideOffset={4} strategy="fixed">{@render copyMenuItems()}</DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
    {#if search}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class="bcx-section-tab" aria-label={`Search ${kind}: ${name}`} title={`Search ${kind}: ${name}`}>
          <Search size={16} aria-hidden="true" /><span>Search</span><ChevronDown size={14} aria-hidden="true" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal to={container?.closest('.bcx-side-panel-shell') ?? undefined}>
          <DropdownMenu.Content class="preview-item-menu" align="start" sideOffset={4} strategy="fixed">{@render searchMenuItems()}</DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    {/if}
    {#if preview && previewItem}
      <button type="button" class="bcx-section-tab" aria-label={`${previewLabel}: ${name}`} title={`${previewLabel}: ${name}`} onclick={() => { if (previewItem) preview.show(previewItem); }}>
        <Eye size={16} aria-hidden="true" /><span>Preview</span>
      </button>
    {/if}
  {:else}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={iconOnly ? 'item-button item-menu-trigger' : 'bcx-section-tab'} aria-label={actionTitle} title={`${actionTitle}\n${copyValue}${pageUrl ? `\n${pageUrl}` : ''}`} onclick={(event) => { if (iconOnly) event.stopPropagation(); }} onkeydown={(event) => { if (iconOnly) event.stopPropagation(); }} ondblclick={(event) => { if (iconOnly) event.stopPropagation(); }}>
      {#snippet child({ props })}
        <button {...props} type="button">
          {#if copied}
            <Check size={iconOnly || toolbar ? 16 : 14} class="shrink-0 text-emerald-300" aria-hidden="true" />
          {:else if iconOnly}
            <Ellipsis size={16} class="shrink-0" aria-hidden="true" />
          {:else if image && image !== failedImage}
            <img src={image} alt="" class="item-image" onerror={() => { failedImage = image; }} />
          {:else if kind === 'band' || toolbar}
            <Disc size={toolbar ? 16 : 14} class="shrink-0" aria-hidden="true" />
          {/if}
          {#if !iconOnly}
            <span class="item-name">{menuLabel ?? (toolbar ? toolbarLabel : name)}</span>
            <ChevronDown size={14} class="shrink-0" aria-hidden="true" />
          {/if}
        </button>
      {/snippet}
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
        {#if pinPage}
          <DropdownMenu.Item class="preview-item-menu-action" disabled={pinSaving || $pinnedNavigation.loading || !!$pinnedNavigation.error} onSelect={() => void pinPageFromMenu()}>
            <Pin size={14} fill={savedPin ? 'currentColor' : 'none'} aria-hidden="true" /><span>{savedPin ? 'Unpin' : 'Pin'} {pinPage.kind}</span>
          </DropdownMenu.Item>
        {/if}
        {#if pageUrl || (preview && previewItem)}
          <DropdownMenu.Separator class="preview-item-menu-separator" />
        {/if}
        {@render copyMenuItems()}
        {#if search}
          <DropdownMenu.Separator class="preview-item-menu-separator" />
          {@render searchMenuItems()}
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
  {#if keepInPreview && !iconOnly && pinPage}<BcxPinButton page={pinPage} {toolbar} />{/if}
  {/if}
  <span role="status" class="sr-only">{copied ? 'Copied' : ''}</span>
  {#if error}<span role="alert">{error}</span>{/if}
</div>

<style>
.preview-item-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; min-width: 0; max-width: 100%; }
.toolbar { display: contents; }
.named-title :global(.bcx-section-tab) { max-width: 100%; }
.named-title .item-name { overflow: visible; white-space: normal; overflow-wrap: anywhere; text-align: left; }
.item-menu-trigger { display: inline-flex; align-items: center; justify-content: center; padding: 4px; border: 0; border-radius: 4px; background: transparent; color: #d1d5db; cursor: pointer; }
.item-menu-trigger:hover { background: rgb(255 255 255 / 10%); color: #fff; }
.item-menu-trigger:focus-visible { outline: 2px solid #38bdf8; }
.item-image { width: 16px; height: 16px; flex-shrink: 0; border-radius: 0.125rem; object-fit: cover; }
.item-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:global(.preview-item-menu) { z-index: 1000000; max-width: min(20rem, calc(100vw - 24px)); max-height: var(--bits-dropdown-menu-content-available-height); overflow-y: auto; padding: 0.25rem; border: 1px solid #4b5563; border-radius: 0.375rem; background: #111827; color: #f9fafb; box-shadow: 0 4px 12px rgb(0 0 0 / 25%); }
:global(.preview-item-menu-action) { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.8125rem; cursor: pointer; }
:global(.preview-item-menu-action[data-highlighted]) { background: #293548; outline: none; }
:global(.preview-item-menu-separator) { height: 1px; margin: 0.25rem; background: #4b5563; }
.action-text { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 0.125rem; }
.action-value { color: #9ca3af; font-size: 0.75rem; overflow-wrap: anywhere; white-space: pre-wrap; }
[role='alert'] { color: #fca5a5; font-size: 0.75rem; }
</style>
