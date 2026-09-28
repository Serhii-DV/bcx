<script lang="ts">
import { Music } from '@lucide/svelte';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type { Url } from 'src/core/url';

let { url, image, name }: { url: Url; image?: string; name?: string } =
  $props();
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

<a class="preview-link text-gray-400 hover:text-sky-300" class:band-link={!!name} href={url.toString()} onclick={openPage} title={name ? `${name}\n${url}` : url.toString()}>
  {#if name}
    {#if image && image !== failedImage}
      <img src={image} alt="" class="band-link-image" onerror={() => { failedImage = image; }} />
    {:else}
      <span class="band-link-icon" aria-hidden="true"><Music size={10} /></span>
    {/if}
    <span>{name}</span>
  {:else}
    {url.toString()}
  {/if}
</a>
{#if error}<p role="alert">{error}</p>{/if}

<style>
.preview-link { display: block; width: fit-content; max-width: 100%; overflow-wrap: anywhere; }
.preview-link:hover { text-decoration: underline; }
.preview-link:focus-visible { outline: 1px solid #38bdf8; outline-offset: 2px; border-radius: 0.25rem; }
.preview-link.band-link { display: inline-flex; align-items: center; gap: 0.25rem; margin-block: 0.1875rem; padding: 0.1875rem 0.3125rem; border: 1px solid rgb(156 163 175 / 20%); border-radius: 0.1875rem; background: rgb(255 255 255 / 5%); color: #e5e7eb; font-size: 0.75rem; line-height: 1rem; font-weight: 600; }
.preview-link.band-link:hover { background: rgb(255 255 255 / 12%); color: #7dd3fc; text-decoration: none; }
.band-link-image, .band-link-icon { width: 1rem; height: 1rem; flex-shrink: 0; border-radius: 0.125rem; }
.band-link-image { object-fit: cover; }
.band-link-icon { display: inline-flex; align-items: center; justify-content: center; background: rgb(255 255 255 / 5%); }
p { color: #fca5a5; }
</style>
