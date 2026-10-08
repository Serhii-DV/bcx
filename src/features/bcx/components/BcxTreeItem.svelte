<script lang="ts">
import 'country-flag-icons/3x2/flags.css';
import { ImageOff } from '@lucide/svelte';
import { Artwork } from 'src/bandcamp/domain/artwork/artwork';
import { ArtworkSize } from 'src/bandcamp/domain/artwork/artworkSize';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import { TreeItemButtonFactory } from 'src/features/treeview/buttons/factory';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { TreeItemButton } from 'src/features/treeview/TreeItemButton';
import { ICON_EXTERNAL_LINK, makeIcon } from 'src/features/treeview/utils/icon';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { pinnedPageFromItem } from '../pinnedPage';
import BcxPinButton from './BcxPinButton.svelte';
import { createItemUrl } from './itemUrl';

interface Props {
  item: TreeItem;
  showActions?: boolean;
}

let { item, showActions = true }: Props = $props();
let isReleaseOrBand = $derived(!!(item.previewInformation || item.bandPreview));
let itemImage = $derived(
  isReleaseOrBand && item.image
    ? (Artwork.fromUrl(item.image)?.getUrl(ArtworkSize.SMALL) ?? item.image)
    : item.image,
);
let displayUrl = $derived.by(() => {
  if (!item.previewInformation && !item.bandPreview) return undefined;
  const url = createItemUrl(item.bandPreview?.url ?? item.href ?? item.id);
  if (!url) return undefined;
  return item.bandPreview
    ? BandcampUrlFactory.createBandUrl(url).hostname
    : url.withoutProtocol;
});
let failedImage = $state<string>();
let childrenCount = $derived(item.childrenCount ?? item.children?.length ?? 0);
let pinPage = $derived(pinnedPageFromItem(item));
let primaryButtons = $derived(
  (item.buttons ?? []).filter((button) => !pinPage || !button.href),
);
let browserButtons = $derived(
  pinPage ? (item.buttons ?? []).filter((button) => !!button.href) : [],
);
let browserButton = $derived.by(() => {
  const page = pinPage;
  if (
    !page ||
    browserButtons.some(
      (button) => button.href === item.href || button.href === page.url,
    )
  )
    return undefined;
  return {
    ...TreeItemButtonFactory.createExternalLink(`Open\n${page.url}`, page.url),
    onClick: () => void openBrowserPage(page.url),
  };
});
let error = $state('');

async function openBrowserPage(url: string) {
  error = '';
  try {
    if (!(await openUrlInActiveTab(url))) window.location.assign(url);
  } catch (reason) {
    error = getErrorMessage(reason, 'Could not open the Bandcamp page.');
  }
}
</script>

{#snippet treeItemButton(button: TreeItemButton)}
  {@const Icon = button.icon}
  {#if button.href}
    <a
      href={button.href}
      title={button.title}
      aria-label={button.title}
      class="item-button inline-flex items-center justify-center p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
      onclick={(e) => {
        e.stopPropagation();
        if (button.onClick) {
          e.preventDefault();
          button.onClick(e.currentTarget as HTMLElement);
        }
      }}
    >
      <Icon size="16" />
    </a>
  {:else}
    <button
      type="button"
      title={button.title}
      aria-label={button.title}
      class="item-button cursor-pointer inline-flex items-center justify-center p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
      onclick={(e) => {
        e.stopPropagation();
        if (button.onClick) {
          button.onClick(e.currentTarget as HTMLElement);
        }
      }}
    >
      <Icon size="16" />
    </button>
  {/if}
{/snippet}

{#snippet treeItemButtons()}
  {#if primaryButtons.length || pinPage}
<div class="item-buttons">
  {#each primaryButtons as button}
    {@render treeItemButton(button)}
  {/each}
  {#if pinPage}<BcxPinButton page={pinPage} iconOnly />{/if}
  {#each browserButtons as button}
    {@render treeItemButton(button)}
  {/each}
  {#if browserButton}{@render treeItemButton(browserButton)}{/if}
</div>
  {/if}
{/snippet}

{#snippet treeItemActionIcon(item: TreeItem)}
  {@const Icon = makeIcon(item.actionIcon)}
  <span
    class="item-action-feedback text-emerald-300"
    aria-live="polite"
    aria-atomic="true"
  ></span>
  {#if Icon && !(pinPage && item.actionIcon === ICON_EXTERNAL_LINK)}
  <span
    class="item-action-icon text-gray-300"
    class:item-external-link-icon={item.actionIcon === ICON_EXTERNAL_LINK}
  ><Icon size="16" /></span>
  {/if}
{/snippet}

{#snippet treeItemTimestamp(timestamp: NonNullable<TreeItem['timestamp']>)}
  <span class="item-timestamp text-gray-400">
    {timestamp.label}
    <relative-time
      datetime={timestamp.dateTime}
      format="relative"
      precision="minute"
    >{new Date(timestamp.dateTime).toLocaleString()}</relative-time>
  </span>
{/snippet}

{#snippet treeItemImage(item: TreeItem)}
  {@const ImageIcon = makeIcon(item.image)}
  {#if isReleaseOrBand || item.image !== undefined || item.flagCode}
    <span class="bcx-tree-item-img flex-shrink-0" class:largeArtwork={isReleaseOrBand} aria-hidden={item.image || item.flagCode ? undefined : 'true'}>
      {#if item.flagCode}
        <span class={'flag:' + item.flagCode} aria-hidden="true"></span>
      {:else if item.image && ImageIcon}
        <span class="bcx-tree-item-image-icon text-gray-300" aria-hidden="true">
          <ImageIcon size="16" />
        </span>
      {:else if itemImage && itemImage !== failedImage}
        <img src={itemImage} alt={item.label} class="bcx-tree-item-image" loading="lazy" onerror={() => { failedImage = itemImage; }} />
      {:else}
        <span class="bcx-tree-item-placeholder" aria-hidden="true"><ImageOff size={isReleaseOrBand ? 24 : 16} /></span>
      {/if}
    </span>
  {/if}
{/snippet}

{@render treeItemImage(item)}
<span class="item-label-content">
  <span class="item-label">{item.label}</span>
  {#if displayUrl}
    <span class="item-url text-gray-400">{displayUrl}</span>
  {/if}
  {#if item.timestamp}
    {@render treeItemTimestamp(item.timestamp)}
  {/if}
  {#if item.secondaryTimestamp}
    {@render treeItemTimestamp(item.secondaryTimestamp)}
  {/if}
</span>
{#if showActions}
<div class="item-actions ml-auto flex gap-1 flex-shrink-0" role="presentation">
  {@render treeItemButtons()}
  {#if childrenCount > 0}
    <span class="item-count text-gray-400">{childrenCount}</span>
  {/if}
</div>
{@render treeItemActionIcon(item)}
{#if error}<span role="alert" class="text-red-300 text-xs">{error}</span>{/if}
{/if}

<style>
.bcx-tree-item-img {
  width: 25px;
  height: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.125rem;
  margin-right: 0.5rem;
}

.bcx-tree-item-img.largeArtwork {
  width: 50px;
  height: 50px;
}

.bcx-tree-item-image-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bcx-tree-item-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 0.25rem;
  background: #293548;
  color: #9ca3af;
}

.bcx-tree-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-count {
  display: inline-flex;
  padding-block: 0.25rem;
  vertical-align: middle;
}

.item-label-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  padding-block: 0.25rem;
}

.item-label {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.item-url {
  font-size: 0.75rem;
  line-height: 1rem;
  overflow-wrap: anywhere;
}

.item-timestamp {
  font-size: 0.75rem;
  line-height: 1rem;
}

.item-count {
  font-size: 0.75rem;
}

.item-actions {
  padding-right: 5px;
}

.item-action-icon {
  margin: 0 5px;
}

.item-action-feedback {
  display: none;
  margin: 0 5px;
  font-size: 0.75rem;
  font-weight: 600;
}

:global(.tree-item[data-action-feedback="true"]) .item-action-feedback {
  display: inline-flex;
}

:global(.tree-item[data-action-feedback="true"]) .item-action-icon {
  display: none;
}

.item-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.item-external-link-icon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

:global(.tree-item:hover) .item-buttons,
:global(.tree-item:focus) .item-buttons,
:global(.tree-item:focus-within) .item-buttons,
:global(.tree-item.focused) .item-buttons,
:global(.tree-item:hover) .item-external-link-icon,
:global(.tree-item:focus) .item-external-link-icon,
:global(.tree-item:focus-within) .item-external-link-icon,
:global(.tree-item.focused) .item-external-link-icon {
  opacity: 1;
}

:global(.tree-item) {
  max-width: 100%;
  min-width: 0;
}

:global(.bcx-tree-view .tree-item:hover) {
  background-color: #293548;
  color: #e5e7eb;
}

:global(.bcx-tree-view .tree-item.focused) {
  background-color: #374151;
  color: #d1d5db;
}

:global(.bcx-tree-view:focus-within .tree-item.focused),
:global(.bcx-tree-view .tree-item:focus-within) {
  background-color: #075985;
  color: #ffffff;
}

:global(.bcx-tree-view .tree-item:focus:not(:focus-visible)) {
  outline: none;
}

:global(.bcx-tree-view .tree-item:focus-visible) {
  outline: 1px solid #38bdf8;
  outline-offset: -1px;
}
</style>
