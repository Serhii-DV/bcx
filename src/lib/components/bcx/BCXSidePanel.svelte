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
let drawerHandle: HTMLElement | null = $state(null);
let handleOpacity = $state(0.35);

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

function handleMouseMove(event: MouseEvent) {
  if (!drawerHandle) return;

  const rect = drawerHandle.getBoundingClientRect();
  const deltaX =
    event.clientX < rect.left
      ? rect.left - event.clientX
      : event.clientX > rect.right
        ? event.clientX - rect.right
        : 0;
  const proximity = Math.max(0, 1 - deltaX / 100);

  handleOpacity = 0.35 + proximity * 0.65;
}
</script>

<svelte:document onmousemove={handleMouseMove} />

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
    bind:this={drawerHandle}
    class="bcx-drawer-handle"
    role="button"
    tabindex="0"
    aria-label="Toggle BCX side panel"
    aria-pressed={open}
    style={`--bcx-handle-opacity: ${handleOpacity};`}
    title="BCX - Side Panel.
Use Ctrl+D to toggle"
    onclick={handleToggle}
    onkeydown={handleKeyDown}
  >
    {#if open}
      <PanelLeftOpen size="16" />
    {:else}
      <PanelLeftClose size="16" />
    {/if}
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
    background: rgb(31 41 55 / 85%);
    color: #f9fafb;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    opacity: var(--bcx-handle-opacity, 0.35);
    transition:
      width 220ms ease,
      opacity 220ms ease,
      background-color 220ms ease,
      box-shadow 220ms ease;
  }

  :global(.bcx-drawer-handle:hover),
  :global(.bcx-drawer-handle:focus-visible) {
    width: 28px;
    opacity: 1;
    background: rgb(31 41 55 / 95%);
    box-shadow:
      inset -1px 0 0 rgb(156 163 175 / 30%),
      0 0 0 2px rgba(59, 130, 246, 0.18);
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.bcx-side-panel-shell),
    :global(.bcx-drawer-handle) {
      transition: none;
    }
  }
</style>
