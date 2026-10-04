<script lang="ts">
import { Check, ChevronDown, Copy } from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { copyToClipboard } from 'src/utils/clipboard';
import { onDestroy } from 'svelte';

let {
  label,
  items,
}: {
  label: string;
  items: { label: string; value: string }[];
} = $props();
let container = $state<HTMLDivElement>();
let copied = $state(false);
let error = $state('');
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
let destroyed = false;
onDestroy(() => {
  destroyed = true;
  clearTimeout(feedbackTimer);
});

async function copy(value: string) {
  clearTimeout(feedbackTimer);
  copied = false;
  error = '';
  try {
    await copyToClipboard(value);
    if (destroyed) return;
    copied = true;
    feedbackTimer = setTimeout(() => {
      copied = false;
    }, 1800);
  } catch {
    if (!destroyed) error = 'Could not copy. Please try again.';
  }
}
</script>

<div bind:this={container} class="preview-actions">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="bcx-section-tab" aria-label={label} title={`${label} (menu)`}>
      {#if copied}<Check size={14} class="text-emerald-300" aria-hidden="true" />{:else}<Copy size={14} aria-hidden="true" />{/if}
      Copy
      <ChevronDown size={14} class="shrink-0" aria-hidden="true" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal to={container?.closest('.bcx-side-panel-shell') ?? undefined}>
      <DropdownMenu.Content class="preview-actions-menu" align="end" sideOffset={4} strategy="fixed">
        {#each items as item}
          <DropdownMenu.Item class="preview-actions-item" title={item.value} onSelect={() => { void copy(item.value); }}>
            <span>{item.label}</span>
            <span class="copy-value">{item.value}</span>
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
  <span role="status" class="sr-only">{copied ? 'Copied' : ''}</span>
  {#if error}<span role="alert">{error}</span>{/if}
</div>

<style>
.preview-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: #9ca3af; }
:global(.preview-actions-menu) { z-index: 1000000; max-width: min(20rem, calc(100vw - 24px)); max-height: var(--bits-dropdown-menu-content-available-height); overflow-y: auto; padding: 0.25rem; border: 1px solid #4b5563; border-radius: 0.375rem; background: #111827; color: #f9fafb; box-shadow: 0 4px 12px rgb(0 0 0 / 25%); }
:global(.preview-actions-item) { display: flex; flex-direction: column; gap: 0.125rem; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.8125rem; cursor: pointer; }
.copy-value { color: #9ca3af; font-size: 0.75rem; overflow-wrap: anywhere; white-space: pre-wrap; }
:global(.preview-actions-item[data-highlighted]) { background: #293548; outline: none; }
[role='alert'] { color: #fca5a5; }
</style>
