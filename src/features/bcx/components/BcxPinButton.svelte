<script lang="ts">
import { Pin } from '@lucide/svelte';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { type PinnedPage, samePinnedPage } from '../pinnedNavigation';
import { changePin, pinnedNavigation } from '../stores/pinnedNavigation';

let { page, iconOnly = false }: { page: PinnedPage; iconOnly?: boolean } =
  $props();
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

<span class="pin-action">
  <button type="button" class={iconOnly ? 'item-button pin-icon-button' : 'bcx-section-tab'} {disabled} title={`${label}: ${page.title}`} aria-label={`${label}: ${page.title}`} aria-pressed={!!saved} onclick={(event) => { if (iconOnly) event.stopPropagation(); void activate(); }} onkeydown={(event) => { if (iconOnly) event.stopPropagation(); }} ondblclick={(event) => { if (iconOnly) event.stopPropagation(); }}>
    <Pin size={iconOnly ? 16 : 14} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />{#if !iconOnly}<span>{label}</span>{/if}
  </button>
  {#if error}<span role="alert" class="pin-error">{error}<button type="button" class="item-button" onclick={(event) => { event.preventDefault(); event.stopPropagation(); void activate(); }}>Retry</button></span>{/if}
</span>

<style>
.pin-action { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.pin-icon-button { display: inline-flex; align-items: center; justify-content: center; padding: 4px; border: 0; border-radius: 4px; background: transparent; color: #d1d5db; cursor: pointer; }
.pin-icon-button:hover { background: rgb(255 255 255 / 10%); color: #fff; }
.pin-icon-button:focus-visible { outline: 2px solid #38bdf8; }
.pin-icon-button:disabled { opacity: 0.4; cursor: default; }
.pin-error { color: #fca5a5; font-size: 0.75rem; }
</style>
