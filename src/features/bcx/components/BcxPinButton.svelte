<script lang="ts">
import { MoreHorizontal, Pin } from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { type PinnedPage, samePinnedPage } from '../pinnedNavigation';
import { changePin, pinnedNavigation } from '../stores/pinnedNavigation';

let { page, menu = false }: { page: PinnedPage; menu?: boolean } = $props();
let container = $state<HTMLSpanElement>();
let saving = $state(false);
let error = $state('');
const saved = $derived(
  $pinnedNavigation.items.find((other) => samePinnedPage(page, other)),
);
const label = $derived(`${saved ? 'Unpin' : 'Pin'} ${page.kind}`);
const disabled = $derived(
  saving || $pinnedNavigation.loading || !!$pinnedNavigation.error,
);

async function activate() {
  if (disabled) return;
  saving = true;
  error = '';
  const selected = page;
  const existing = saved;
  try {
    await changePin(
      existing
        ? { action: 'unpin', page: existing }
        : { action: 'pin', page: selected },
    );
  } catch (reason) {
    error = getErrorMessage(
      reason,
      'Could not save this pin. Please try again.',
    );
  } finally {
    saving = false;
  }
}
</script>

<span bind:this={container} class="pin-action">
  {#if menu}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="item-button pin-menu-trigger" aria-label={`Actions for ${page.title}`} title={`Actions for ${page.title}`} onclick={(event) => { event.stopPropagation(); }} onkeydown={(event) => { event.stopPropagation(); }}>
        <MoreHorizontal size={16} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal to={container?.closest('.bcx-side-panel-shell') ?? undefined}>
        <DropdownMenu.Content class="preview-item-menu" data-bcx-sidebar-menu side="bottom" align="end" sideOffset={4} strategy="fixed">
          <DropdownMenu.Item class="preview-item-menu-action" {disabled} onSelect={() => void activate()}>
            <Pin size={14} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />{label}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  {:else}
    <button type="button" class="bcx-section-tab" {disabled} title={`${label}: ${page.title}`} aria-label={`${label}: ${page.title}`} aria-pressed={!!saved} onclick={() => void activate()}>
      <Pin size={14} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" /><span>{label}</span>
    </button>
  {/if}
  {#if error}<span role="alert" class="pin-error">{error}<button type="button" class="item-button" onclick={(event) => { event.preventDefault(); event.stopPropagation(); void activate(); }}>Retry</button></span>{/if}
</span>

<style>
.pin-action { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 4px; }
:global(.pin-menu-trigger) { display: inline-flex; align-items: center; justify-content: center; padding: 4px; border: 0; border-radius: 4px; background: transparent; color: #d1d5db; cursor: pointer; }
:global(.pin-menu-trigger:hover) { background: rgb(255 255 255 / 10%); color: #fff; }
:global(.pin-menu-trigger:focus-visible) { outline: 2px solid #38bdf8; }
.pin-error { color: #fca5a5; font-size: 0.75rem; }
</style>
