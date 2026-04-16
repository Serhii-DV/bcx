<script lang="ts">
import { PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';

interface Props {
  sidePanelOpen: boolean;
  onToggle: () => void;
}

let { sidePanelOpen, onToggle }: Props = $props();

function handleToggle() {
  onToggle();
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onToggle();
  }
}
</script>

<div
  id="bcx-drawer-button"
  class="bcx-drawer-button"
  role="button"
  tabindex="0"
  aria-label="Toggle BCX side panel"
  aria-pressed={sidePanelOpen}
  title="BCX - Side Panel.
Use Ctrl+D to toggle"
  onclick={handleToggle}
  onkeydown={handleKeyDown}
>
  <span class="drawer-icon" aria-hidden="true">
    {#if sidePanelOpen}
      <PanelLeftClose size="24" />
    {:else}
      <PanelLeftOpen size="24" />
    {/if}
  </span>
</div>

<style>
  /* BCX Drawer Button Styles */
  :global(.bcx-drawer-button) {
    position: absolute;
    top: 0;
    left: 400px;
    height: 100vh;
    width: 48px;
    border: 0;
    color: #f9fafb;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    background-color: transparent;
    transition: background-color 220ms ease;
  }

  :global(.bcx-drawer-button:hover),
  :global(.bcx-drawer-button:focus-visible) {
    background: rgb(31 41 55 / 95%);
    outline: none;
  }

  :global(.bcx-drawer-button .drawer-icon) {
    color: #04b1fe;
    opacity: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.bcx-drawer-button) {
      transition: none;
    }
  }
</style>
