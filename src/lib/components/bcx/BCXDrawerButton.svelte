<script lang="ts">
import { PanelLeftClose, PanelLeftOpen } from 'lucide-svelte';
import { onMount } from 'svelte';

interface Props {
  sidePanelOpen: boolean;
  onToggle: () => void;
}

let { sidePanelOpen, onToggle }: Props = $props();

let drawerButton: HTMLElement | null = $state(null);
let isNearButton = $state(false);
let cursorY = $state(0);

// Initial positioning setup
onMount(() => {
  // Component is ready
});

// Effect to position the drawer button relative to the side panel
$effect(() => {
  if (!drawerButton) return;

  const leftOffset = getButtonLeftPosition();
  drawerButton.style.left = `${leftOffset}px`;
});

// Effect to update button vertical position based on cursor
$effect(() => {
  if (!drawerButton) return;

  // Position button at cursor Y position when near button area
  // Return to middle when cursor leaves button area
  drawerButton.style.top = isNearButton ? `${cursorY}px` : '50%';
});

function getButtonLeftPosition() {
  const sidePanelWidth = 400;
  const leftMargin = 10;
  return sidePanelOpen ? sidePanelWidth + leftMargin : leftMargin;
}

function handleMouseMove(e: MouseEvent) {
  // Calculate the button's current left position based on side panel state
  const buttonLeftPosition = getButtonLeftPosition();
  const delta = 100;

  // Check if cursor is within 100px of the button's current horizontal position
  const isNearButtonHorizontally =
    e.clientX < buttonLeftPosition + delta &&
    e.clientX > buttonLeftPosition - delta;

  // Update states
  isNearButton = isNearButtonHorizontally;

  // Update cursor Y position
  cursorY = e.clientY;
}

function handleButtonClick() {
  onToggle();
}
</script>

<svelte:document onmousemove={handleMouseMove} />

<button
  id="bcx-drawer-button"
  bind:this={drawerButton}
  class="bcx-drawer-button"
  class:near-edge={isNearButton}
  title="BCX - Side Panel.
Use Ctrl+D to toggle"
  onclick={handleButtonClick}
>
  {#if sidePanelOpen}
    <PanelLeftOpen size="16" />
  {:else}
    <PanelLeftClose size="16" />
  {/if}
</button>

<style>
  :global(:root) {
    --bcx-drawer-left-margin: 10px;
  }

  /* BCX Drawer Button Styles */
  :global(.bcx-drawer-button) {
    background: #1f2937;
    border: 1px solid #374151;
    color: #f9fafb;
    border-radius: 50%;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
    transform: translateY(-50%);
    position: fixed;
    left: var(--bcx-drawer-left-margin);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.3;
  }

  :global(.bcx-drawer-button.near-edge) {
    opacity: 1;
  }

  :global(.bcx-drawer-button:hover) {
    background: #374151;
    border-color: #4b5563;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  :global(.bcx-drawer-button:focus) {
    background: #374151;
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }


</style>
