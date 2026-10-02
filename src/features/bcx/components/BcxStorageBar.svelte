<script lang="ts">
import { storageCategoryColor } from '../storageColors';
import { formatStorageBytes, type StorageCategoryUsage } from '../storageUsage';

let {
  categories,
  label,
}: { categories: StorageCategoryUsage[]; label: string } = $props();
const total = $derived(
  categories.reduce((sum, category) => sum + category.bytes, 0),
);
const segments = $derived.by(() => {
  let offset = 0;
  return categories.map((category) => {
    const width = total ? (category.bytes / total) * 100 : 0;
    const segment = { ...category, offset, width };
    offset += width;
    return segment;
  });
});
</script>

{#if total > 0}
  <figure>
    <figcaption>{label} by category</figcaption>
    <svg viewBox="0 0 100 16" preserveAspectRatio="none" role="img" aria-label={`${label} by category. ${segments.map((segment) => `${segment.label}: ${formatStorageBytes(segment.bytes)}, ${segment.width.toFixed(1)}%`).join('; ')}`}>
      {#each segments as segment (segment.label)}
        <rect x={segment.offset} y="0" width={segment.width} height="16" fill={storageCategoryColor(segment.label)}>
          <title>{segment.label}: {formatStorageBytes(segment.bytes)} ({segment.width.toFixed(1)}%)</title>
        </rect>
      {/each}
    </svg>
    <ul aria-label={`${label} category legend`}>
      {#each segments as segment (segment.label)}
        <li><span style:background={storageCategoryColor(segment.label)} aria-hidden="true"></span>{segment.label}</li>
      {/each}
    </ul>
  </figure>
{/if}

<style>
  figure { margin: 12px 0; }
  figcaption { color: #9ca3af; margin-bottom: 6px; font-size: 0.75rem; }
  svg { display: block; width: 100%; height: 16px; border-radius: 4px; overflow: hidden; }
  ul { display: flex; flex-wrap: wrap; gap: 6px 12px; padding: 0; margin: 8px 0 0; list-style: none; font-size: 0.75rem; }
  li { display: flex; align-items: center; gap: 4px; }
  li span { flex-shrink: 0; width: 10px; height: 10px; border-radius: 2px; }
</style>
