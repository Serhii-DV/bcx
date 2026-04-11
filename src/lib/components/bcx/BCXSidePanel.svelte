<script lang="ts">
import { PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';
import { TreeData } from 'src/app/treeview/TreeData';
import BcxTreeView from './BcxTreeView.svelte';

interface Props {
  treeData: TreeData;
  open?: boolean;
  onToggle?: () => void;
}

let { treeData, open = false, onToggle = () => {} }: Props = $props();
let treeViewRef: BcxTreeView;

// Focus first item when panel opens
$effect(() => {
  if (open && treeViewRef) {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      treeViewRef.focusFirstItem();
    }, 100);
  }
});

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
  id="bcx-side-panel"
  class="bcx-side-panel-shell {open ? 'open' : ''}"
>
  <div class="bcx-side-panel-content fixed inset-y-0 left-0 z-[999998] backdrop-blur-md font-medium text-white dark:text-white transition-opacity duration-400">
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="border-b border-gray-200/30 dark:border-gray-700/30 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Music Explorer</h2>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4">

          <!-- Tree View Demo -->
          <div class="text-md">
            <BcxTreeView bind:this={treeViewRef} treeData={treeData} />
          </div>

          <!-- Extension Info -->
          <div class="p-3">
            <h3 class="mb-2">Extension Info</h3>
            <p class="text-sm">
              BCX enhances your Bandcamp experience with powerful search and filtering tools.
            </p>
          </div>

          <!-- Keyboard Shortcuts -->
          <div class="p-3">
            <h3 class="mb-2">Keyboard Shortcuts</h3>
            <div class="space-y-1 text-sm">
              <div><kbd class="kbd">Ctrl+D</kbd> Toggle panel</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    id="bcx-drawer-button"
    class="bcx-drawer-handle"
    role="button"
    tabindex="0"
    aria-label="Toggle BCX side panel"
    aria-pressed={open}
    title="BCX - Side Panel.
Use Ctrl+D to toggle"
    onclick={handleToggle}
    onkeydown={handleKeyDown}
  >
    <span class="drawer-icon" aria-hidden="true">
      {#if open}
        <PanelLeftClose size="16" />
      {:else}
        <PanelLeftOpen size="16" />
      {/if}
    </span>
  </div>
</div>

<style>
  /* Custom kbd styling */
  :global(.kbd) {
    background: #374151;
    color: #f9fafb;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-family: monospace;
    border: 1px solid #4b5563;
  }

  :global(.bcx-side-panel-shell) {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 999999;
    width: 424px;
    transform: translateX(-400px);
    transition: transform 260ms cubic-bezier(0.25, 0.8, 0.25, 1);
    pointer-events: none;
  }

  :global(.bcx-side-panel-shell.open) {
    transform: translateX(0);
  }

  :global(.bcx-side-panel-content) {
    background-color: rgb(31 41 55 / 85%);
    width: 400px;
    pointer-events: auto;
  }

  :global(.bcx-drawer-handle) {
    position: absolute;
    top: 0;
    left: 400px;
    height: 100vh;
    width: 24px;
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

  :global(.bcx-drawer-handle .drawer-icon) {
    color: #f9fafb;
    opacity: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  :global(.bcx-drawer-handle:hover),
  :global(.bcx-drawer-handle:focus-visible) {
    background: rgb(31 41 55 / 95%);
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.bcx-side-panel-shell),
    :global(.bcx-drawer-handle) {
      transition: none;
    }
  }
</style>
