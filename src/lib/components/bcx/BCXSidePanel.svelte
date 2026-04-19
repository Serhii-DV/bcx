<script lang="ts">
import { TreeData } from 'src/app/treeview/TreeData';
import iconUrl from 'src/assets/icons/icon-48.png';
import BCXDrawerButton from './BCXDrawerButton.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

interface Props {
  treeData: TreeData;
  open?: boolean;
  onToggle?: () => void;
}

let { treeData, open = false, onToggle = () => {} }: Props = $props();
let treeBrowserRef: BcxTreeBrowser;

// Focus first item when panel opens
$effect(() => {
  if (open && treeBrowserRef) {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      treeBrowserRef.focusFirstItem();
    }, 100);
  }
});
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
          <div class="flex items-center gap-2">
            <img src={iconUrl} alt="BCX" class="w-12 h-12" />
            <h2 class="text-lg font-semibold">Music Explorer</h2>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4">

          <!-- Tree Browser -->
          <div class="text-md">
            <BcxTreeBrowser bind:this={treeBrowserRef} treeData={treeData} />
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

  <BCXDrawerButton sidePanelOpen={open} {onToggle} />
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

  @media (prefers-reduced-motion: reduce) {
    :global(.bcx-side-panel-shell) {
      transition: none;
    }
  }
</style>
