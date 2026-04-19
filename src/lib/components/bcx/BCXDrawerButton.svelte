<script lang="ts">
import { PanelLeftOpen } from '@lucide/svelte';

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

{#if !sidePanelOpen}
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
      <PanelLeftOpen size="24" />
    </span>
  </div>
{/if}

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
    background: rgb(6 15 27 / 95%);
    color: #04b1fe;
    outline: none;
  }

  :global(.bcx-drawer-button .drawer-icon) {
    align-items: center;
    background: rgb(6 15 27 / 95%);
    border-radius: 50%;
    color: #3c7088;
    justify-content: center;
    display: inline-flex;
    height: 40px;
    opacity: 1;
    width: 40px;
  }

  :global(.bcx-drawer-button:hover .drawer-icon),
  :global(.bcx-drawer-button:focus-visible .drawer-icon) {
    color: #04b1fe;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.bcx-drawer-button) {
      transition: none;
    }
  }
</style>
