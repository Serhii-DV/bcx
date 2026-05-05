<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  title: string;
  defaultOpen?: boolean;
  children?: Snippet;
}

let { title, defaultOpen = false, children }: Props = $props();
let open = $state(defaultOpen);

function toggleSection() {
  open = !open;
}
</script>

<section class="bcx-section">
  <button
    type="button"
    class="bcx-section-header"
    class:open
    aria-expanded={open}
    onclick={toggleSection}
  >
    <span class="bcx-section-chevron" aria-hidden="true"></span>
    <span class="bcx-section-title">{title}</span>
  </button>
  {#if open}
    <div class="bcx-section-body">
      {@render children?.()}
    </div>
  {/if}
</section>

<style>
.bcx-section {
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

.bcx-section:first-child {
  border-top: 0;
}

.bcx-section-header {
  align-items: center;
  background: transparent;
  border: 0;
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

.bcx-section-header:hover,
.bcx-section-header:focus {
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

.bcx-section-header.open .bcx-section-chevron {
  transform: rotate(90deg);
}

.bcx-section-title {
  min-width: 0;
  overflow-wrap: anywhere;
}

.bcx-section-body {
  padding-bottom: 0.25rem;
}
</style>
