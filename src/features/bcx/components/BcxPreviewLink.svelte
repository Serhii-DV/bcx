<script lang="ts">
import { ExternalLink, Eye, ImageOff } from '@lucide/svelte';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type { Url } from 'src/core/url';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { getItemPreviewContext } from '../stores/itemPreview';

let {
  url,
  image,
  name,
  title,
  plain = false,
  toolbar = false,
  previewItem,
}: {
  url: Url;
  image?: string;
  name?: string;
  title?: string;
  plain?: boolean;
  toolbar?: boolean;
  previewItem?: TreeItem;
} = $props();
const preview = getItemPreviewContext();
let error = $state('');
let failedImage = $state<string>();

async function openPage(event: MouseEvent) {
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
    if (!(await openUrlInActiveTab(url.toString())))
      window.location.assign(url.toString());
  } catch {
    error = 'Could not open the page. Please try again.';
  }
}
</script>

<span class="preview-link-group">
{#if preview && previewItem}
  <button type="button" class="bcx-section-tab preview-button" aria-label={`Preview ${previewItem.bandPreview?.name ?? previewItem.previewInformation?.title ?? name ?? 'item'}`} title={`Preview ${previewItem.bandPreview?.name ?? previewItem.previewInformation?.title ?? name ?? 'item'}`} onclick={() => { if (previewItem) preview.show(previewItem); }}><Eye size={14} aria-hidden="true" /></button>
{/if}
<a class="preview-link text-gray-400 hover:text-sky-300" class:band-link={!!name && !plain && !toolbar} class:plain={plain && !toolbar} class:toolbar class:bcx-section-tab={toolbar} href={url.toString()} onclick={openPage} title={title ? `${title}\n${url}` : name ? `${name}\n${url}` : url.toString()}>
  {#if name}
    {#if !plain && (!toolbar || image)}
      {#if image && image !== failedImage}
        <img src={image} alt="" class="band-link-image" onerror={() => { failedImage = image; }} />
      {:else}
        <span class="band-link-icon" aria-hidden="true"><ImageOff size={10} /></span>
      {/if}
    {/if}
    <span class="preview-link-name">{name}</span>
  {:else}
    {url.toString()}
  {/if}
  <ExternalLink size={12} class="shrink-0" aria-hidden="true" />
</a>
</span>
{#if error}<p role="alert">{error}</p>{/if}

<style>
.preview-link-group { display: inline-flex; align-items: center; min-width: 0; max-width: 100%; }
.preview-button { flex-shrink: 0; }
.preview-link { display: block; width: fit-content; max-width: 100%; overflow-wrap: anywhere; }
.preview-link:hover { text-decoration: underline; }
.preview-link.plain { display: inline-flex; align-items: baseline; gap: 0.25rem; }
.preview-link.toolbar { display: inline-flex; align-items: center; color: inherit; }
.preview-link.toolbar:hover { text-decoration: none; }
.toolbar .preview-link-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preview-link:focus-visible { outline: 1px solid #38bdf8; outline-offset: 2px; border-radius: 0.25rem; }
.preview-link.band-link { display: inline-flex; align-items: center; gap: 0.25rem; margin-block: 0.1875rem; padding: 0.1875rem 0.3125rem; border: 1px solid rgb(156 163 175 / 20%); border-radius: 0.1875rem; background: rgb(255 255 255 / 5%); color: #e5e7eb; font-size: 0.75rem; line-height: 1rem; font-weight: 600; }
.preview-link.band-link:hover { background: rgb(255 255 255 / 12%); color: #7dd3fc; text-decoration: none; }
.band-link-image, .band-link-icon { width: 1rem; height: 1rem; flex-shrink: 0; border-radius: 0.125rem; }
.band-link-image { object-fit: cover; }
.band-link-icon { display: inline-flex; align-items: center; justify-content: center; background: rgb(255 255 255 / 5%); }
p { color: #fca5a5; }
</style>
