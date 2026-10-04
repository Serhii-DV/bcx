<script lang="ts">
import { Ellipsis } from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { copyToClipboard } from 'src/utils/clipboard';

let {
  label,
  items,
}: {
  label: string;
  items: { label: string; value: string }[];
} = $props();
let container = $state<HTMLDivElement>();
let message = $state('');
let error = $state('');

async function copy(value: string) {
  message = '';
  error = '';
  try {
    await copyToClipboard(value);
    message = 'Copied';
  } catch {
    error = 'Could not copy. Please try again.';
  }
}
</script>

<div bind:this={container} class="preview-actions">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="preview-actions-trigger" aria-label={label} title={label}>
      <Ellipsis size={16} aria-hidden="true" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal to={container?.closest('.bcx-side-panel-shell') ?? undefined}>
      <DropdownMenu.Content class="preview-actions-menu" align="end" sideOffset={4} strategy="fixed">
        {#each items as item}
          <DropdownMenu.Item class="preview-actions-item" onSelect={() => { void copy(item.value); }}>
            {item.label}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
  <span role="status">{message}</span>
  {#if error}<span role="alert">{error}</span>{/if}
</div>

<style>
.preview-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: #9ca3af; }
:global(.preview-actions-trigger) { display: inline-flex; align-items: center; justify-content: center; width: 1.75rem; height: 1.75rem; padding: 0; border: 0; border-radius: 0.25rem; background: transparent; color: #9ca3af; cursor: pointer; }
:global(.preview-actions-trigger:hover) { background: rgb(255 255 255 / 8%); color: #e5e7eb; }
:global(.preview-actions-trigger:focus-visible) { outline: 1px solid #38bdf8; outline-offset: 2px; }
:global(.preview-actions-menu) { z-index: 1000000; max-width: min(20rem, calc(100vw - 24px)); max-height: var(--bits-dropdown-menu-content-available-height); overflow-y: auto; padding: 0.25rem; border: 1px solid #4b5563; border-radius: 0.375rem; background: #111827; color: #f9fafb; box-shadow: 0 4px 12px rgb(0 0 0 / 25%); }
:global(.preview-actions-item) { padding: 0.5rem; border-radius: 0.25rem; font-size: 0.8125rem; cursor: pointer; }
:global(.preview-actions-item[data-highlighted]) { background: #293548; outline: none; }
[role='alert'] { color: #fca5a5; }
</style>
