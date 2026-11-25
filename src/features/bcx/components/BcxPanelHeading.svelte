<script lang="ts">
import { Info } from '@lucide/svelte';
import { makeIcon } from 'src/features/treeview/utils/icon';
import type { Snippet } from 'svelte';

let {
  label,
  image,
  title,
  inline = false,
  leadingActions,
  trailingActions,
}: {
  label: string;
  image?: string;
  title?: string;
  inline?: boolean;
  leadingActions?: Snippet;
  trailingActions?: Snippet;
} = $props();

const HeadingIcon = $derived(
  makeIcon(image?.includes('/') ? undefined : image),
);
</script>

<div class="bcx-main-heading" class:inline class:with-close={!!leadingActions}>
  {@render leadingActions?.()}
  <div class="bcx-main-heading-identity">
    <span class="bcx-main-heading-icon" aria-hidden="true">
      {#if HeadingIcon}
        <HeadingIcon size={22} />
      {:else if image}
        <img src={image} alt="" />
      {:else}
        <Info size={22} />
      {/if}
    </span>
    <h3 class="bcx-main-section-title" title={title ? `${label}\n${title}` : label}>{label}</h3>
  </div>
  {@render trailingActions?.()}
</div>

<style>
.bcx-main-heading {
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 40px;
  margin: 0 var(--bcx-preview-gutter, 16px) 8px;
  padding: 4px 0;
}

.bcx-main-heading.with-close {
  margin-left: 0;
  padding-left: 5px;
}

.bcx-main-heading.inline {
  flex: 1 1 0%;
  margin: 0;
  padding: 0;
  min-height: 32px;
}

.bcx-main-heading-identity {
  display: flex;
  flex: 1 1 0%;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.bcx-main-heading-icon {
  box-sizing: border-box;
  display: grid;
  flex: 0 0 24px;
  place-items: center;
  width: 24px;
  height: 24px;
  color: #fff;
}

.bcx-main-heading-icon img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;
}

.bcx-main-section-title {
  min-width: 0;
  flex: 1 1 0%;
  margin: 0;
  overflow: hidden;
  color: #f9fafb;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
