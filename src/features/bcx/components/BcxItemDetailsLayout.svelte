<script lang="ts">
import type { TreeData } from 'src/features/treeview/TreeData';
import type { Snippet } from 'svelte';
import BcxTreeView from './BcxTreeView.svelte';

let {
  image,
  imageAlt,
  heading,
  subheading,
  subheadingPrefix,
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
  subheading?: string;
  subheadingPrefix?: Snippet;
  treeData: TreeData;
  detailsLabel: string;
  loading?: boolean;
  loadingMessage?: string;
  error?: string;
  children?: Snippet;
} = $props();
</script>

<div class="item-details">
  <header class="item-details-header">
    {#if image}
      <img class="item-details-image" src={image} alt={imageAlt} onerror={(event) => event.currentTarget.setAttribute('hidden', '')} />
    {/if}
    <div class="item-details-heading">
      <h3 class="item-details-primary">{heading}</h3>
      {#if subheading}<h4 class="item-details-secondary" class:withPrefix={!!subheadingPrefix}>{@render subheadingPrefix?.()}{subheading}</h4>{/if}
      {@render children?.()}
    </div>
  </header>
  <section class="item-details-tree" aria-label={detailsLabel}>
    {#if loading}<p role="status">{loadingMessage}</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
    {#key treeData}
      <BcxTreeView {treeData} showFilter={false} />
    {/key}
  </section>
</div>

<style>
.item-details { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 100%; }
.item-details-header { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 1rem; }
.item-details-image { width: min(15rem, 52%); aspect-ratio: 1; object-fit: contain; border-radius: 0.25rem; flex-shrink: 0; }
.item-details-heading { min-width: 0; flex: 1 1 0%; overflow-wrap: anywhere; font-size: 0.8125rem; }
.item-details-primary { margin: 0 0 0.5rem; font-size: 2.2rem; font-weight: 300; line-height: 1.1; letter-spacing: 0.01em; }
.item-details-secondary { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 300; line-height: 1.2; letter-spacing: 0.01em; }
.item-details-secondary.withPrefix { display: flex; align-items: center; gap: 0.5rem; }
.item-details-tree { display: flex; flex: 1 1 20rem; flex-direction: column; }
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; }
</style>
