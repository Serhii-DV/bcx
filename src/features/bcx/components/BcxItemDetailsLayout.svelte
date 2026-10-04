<script lang="ts">
import { ImageOff } from '@lucide/svelte';
import type { TreeData } from 'src/features/treeview/TreeData';
import type { Snippet } from 'svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxTreeView from './BcxTreeView.svelte';

let {
  image,
  imageAlt,
  heading,
  headingSize = 2.2,
  subheadingSize = 1.75,
  subheading,
  subheadingPrefix,
  subheadingContent,
  compactImage = false,
  details,
  actions,
  panels,
  treeData,
  detailsLabel,
  loading = false,
  loadingMessage = 'Loading details…',
  error = '',
  children,
}: {
  image?: string;
  imageAlt: string;
  heading: string;
  headingSize?: number;
  subheadingSize?: number;
  subheading?: string;
  subheadingPrefix?: Snippet;
  subheadingContent?: Snippet;
  compactImage?: boolean;
  details?: Snippet;
  actions?: Snippet;
  panels?: Snippet;
  treeData: TreeData;
  detailsLabel: string;
  loading?: boolean;
  loadingMessage?: string;
  error?: string;
  children?: Snippet;
} = $props();
let failedImage = $state<string>();
</script>

<div class="item-details" class:compact-image={compactImage} class:with-panels={!!panels} style:--item-heading-size={`${headingSize}rem`} style:--item-subheading-size={`${subheadingSize}rem`}>
  <header class="item-details-header">
    {#if !compactImage || (image && image !== failedImage)}
      {#if image && image !== failedImage}
        <img class="item-details-image" src={image} alt={imageAlt} onerror={() => { failedImage = image; }} />
      {:else}
        <div class="item-details-image item-details-placeholder" role="img" aria-label={`${imageAlt} unavailable`}>
          <span aria-hidden="true"><ImageOff size={48} /></span>
        </div>
      {/if}
    {/if}
    <div class="item-details-heading">
      <h3 class="item-details-primary">{heading}</h3>
      {#if subheadingContent}<div class="item-details-secondary">{@render subheadingContent()}</div>
      {:else if subheading}<h4 class="item-details-secondary" class:withPrefix={!!subheadingPrefix}>{@render subheadingPrefix?.()}{subheading}</h4>{/if}
      {@render children?.()}
    </div>
  </header>
  <section class="item-details-tree" aria-label={detailsLabel}>
    {#if loading}<p role="status">{loadingMessage}</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
    {@render details?.()}
    {#if actions}<BcxSectionTabs tabs={[]} value="" label={`${detailsLabel} actions`} {actions} wrapActions={true} />{/if}
    {@render panels?.()}
    {#if treeData.items.length}
      {#key treeData}
        <BcxTreeView {treeData} showFilter={false} />
      {/key}
    {/if}
  </section>
</div>

<style>
.item-details { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 100%; }
.item-details.with-panels { min-height: 0; overflow: hidden; }
.with-panels .item-details-header { flex-shrink: 0; }
.with-panels .item-details-tree { flex: 1 1 0%; min-height: 0; overflow: hidden; }
.item-details-header { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 1rem; }
.item-details-image { width: min(12rem, 40%); aspect-ratio: 1; object-fit: contain; border-radius: 0.25rem; flex-shrink: 0; }
.compact-image .item-details-image { width: min(5rem, 25%); }
.item-details-placeholder { display: flex; align-items: center; justify-content: center; border: 1px dashed rgb(156 163 175 / 30%); background: #293548; color: #9ca3af; }
.item-details-heading { min-width: 0; flex: 1 1 0%; overflow-wrap: anywhere; font-size: 0.8125rem; }
.item-details-primary { margin: 0 0 0.5rem; font-size: var(--item-heading-size); font-weight: 300; line-height: 1.1; letter-spacing: 0.01em; }
.item-details-secondary { margin: 0 0 0.25rem; font-size: var(--item-subheading-size); font-weight: 300; line-height: 1.2; letter-spacing: 0.01em; }
.item-details-secondary.withPrefix { display: flex; align-items: center; gap: 0.5rem; }
.item-details-tree { display: flex; flex: 1 1 20rem; flex-direction: column; }
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; }
</style>
