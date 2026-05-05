<script lang="ts">
import { makeIcon } from 'src/app/treeview/utils/icon';
import type { Snippet } from 'svelte';

interface Props {
  title: string;
  icon?: string;
  image?: string;
  height?: string;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: Snippet;
}

let {
  title,
  icon,
  image,
  height = '16rem',
  defaultOpen = false,
  onOpenChange,
  children,
}: Props = $props();
let Icon = $derived(makeIcon(icon));
let bodyStyle = $derived(`--bcx-section-height: ${height};`);

function handleToggle(event: ToggleEvent) {
  onOpenChange?.((event.currentTarget as HTMLDetailsElement).open);
}
</script>

<details class="bcx-section" open={defaultOpen} ontoggle={handleToggle}>
  <summary class="bcx-section-header">
    <span class="bcx-section-chevron" aria-hidden="true"></span>
    <span class="bcx-section-title-media" aria-hidden={icon || image ? undefined : 'true'}>
      {#if Icon}
        <Icon size="16" />
      {:else if image}
        <img src={image} alt="" class="bcx-section-title-image" loading="lazy" />
      {/if}
    </span>
    <span class="bcx-section-title">{title}</span>
  </summary>
  <div class="bcx-section-body" style={bodyStyle}>
    {@render children?.()}
  </div>
</details>

<style>
.bcx-section {
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

.bcx-section:first-child {
  border-top: 0;
}

.bcx-section > .bcx-section-header {
  align-items: center;
  border-radius: 4px;
  color: rgb(229 231 235);
  cursor: pointer;
  display: flex;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  min-width: 0;
  padding: 0.25rem 0.25rem 0.25rem 0;
  text-align: left;
  width: 100%;
}

.bcx-section > .bcx-section-header::-webkit-details-marker {
  display: none;
}

.bcx-section > .bcx-section-header::marker {
  content: "";
}

.bcx-section > .bcx-section-header:hover,
.bcx-section > .bcx-section-header:focus {
  background-color: rgb(255 255 255 / 0.1);
  outline: none;
}

.bcx-section-chevron {
  background-color: currentcolor;
  display: inline-flex;
  flex: 0 0 auto;
  height: 1rem;
  margin-right: 0.25rem;
  transform: rotate(0deg);
  transition: transform 120ms ease;
  width: 1rem;
  -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>');
          mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>');
  -webkit-mask-size: cover;
          mask-size: cover;
}

.bcx-section[open] > .bcx-section-header .bcx-section-chevron {
  transform: rotate(90deg);
}

.bcx-section-title-media {
  align-items: center;
  color: rgb(209 213 219);
  display: inline-flex;
  flex: 0 0 auto;
  height: 1.5rem;
  justify-content: center;
  margin-right: 0.5rem;
  width: 1.5rem;
}

.bcx-section-title-image {
  height: 1.5rem;
  object-fit: cover;
  width: 1.5rem;
}

.bcx-section-title {
  min-width: 0;
  overflow-wrap: anywhere;
}

.bcx-section-body {
  height: var(--bcx-section-height);
  overflow: auto;
  padding-bottom: 0.25rem;
  resize: vertical;
}
</style>
