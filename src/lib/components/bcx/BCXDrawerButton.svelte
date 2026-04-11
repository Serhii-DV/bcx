<script lang="ts">
import { PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';

interface Props {
  sidePanelOpen: boolean;
  onToggle: () => void;
}

let { sidePanelOpen, onToggle }: Props = $props();

let drawerButton: HTMLElement | null = $state(null);

// Effect to position the drawer button relative to the side panel
$effect(() => {
  if (!drawerButton) return;

  const leftOffset = getButtonLeftPosition();
  drawerButton.style.left = `${leftOffset}px`;
});

function getButtonLeftPosition() {
  const sidePanelWidth = 400;
  const leftMargin = 0;
  return sidePanelOpen ? sidePanelWidth + leftMargin : leftMargin;
}

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
  bind:this={drawerButton}
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
      <PanelLeftOpen size="16" />
    {:else}
      <PanelLeftClose size="16" />
    {/if}
  </span>
</div>

<style>
  :global(:root) {
    --bcx-drawer-left-margin: 0px;
  }

  /* BCX Drawer Button Styles */
  :global(.bcx-drawer-button) {
    background: rgb(31 41 55 / 85%);
    border-right: 1px solid rgb(75 85 99 / 55%);
    border-left: none;
    border-top: none;
    border-bottom: none;
    color: #f9fafb;
    border-radius: 0;
    padding: 0;
    cursor: pointer;
    transition:
      left 260ms cubic-bezier(0.25, 0.8, 0.25, 1),
      width 220ms ease,
      box-shadow 220ms ease,
      background-color 220ms ease;
    position: fixed;
    top: 0;
    bottom: 0;
    height: 100vh;
    width: 24px;
    left: var(--bcx-drawer-left-margin);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow:
      inset -1px 0 0 rgba(255, 255, 255, 0.06),
      0 0 0 rgba(59, 130, 246, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.92;
  }

  :global(.bcx-drawer-button:hover) {
    background: rgb(31 41 55 / 95%);
    width: 28px;
    box-shadow:
      inset -1px 0 0 rgb(156 163 175 / 30%),
      0 0 0 2px rgba(59, 130, 246, 0.18);
  }

  :global(.bcx-drawer-button:focus) {
    outline: none;
  }

  :global(.bcx-drawer-button:focus-visible) {
    width: 28px;
    box-shadow:
      inset -1px 0 0 rgba(255, 255, 255, 0.16),
      0 0 0 3px rgba(59, 130, 246, 0.45);
  }

  :global(.bcx-drawer-button .drawer-icon) {
    opacity: 0.7;
    transform: translateX(0);
    transition:
      opacity 180ms ease,
      transform 200ms ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  :global(.bcx-drawer-button:hover .drawer-icon),
  :global(.bcx-drawer-button:focus-visible .drawer-icon) {
    opacity: 1;
    transform: translateX(1px);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.bcx-drawer-button),
    :global(.bcx-drawer-button .drawer-icon) {
      transition: none;
    }
  }
</style>
