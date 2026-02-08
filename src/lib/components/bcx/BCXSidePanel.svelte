<script lang="ts">
import { TreeData } from 'src/app/treeview/treeData';
import BcxTreeView from './BcxTreeView.svelte';

interface Props {
  treeData: TreeData;
  open?: boolean;
  animate?: boolean;
}

let { treeData, open = false, animate = false }: Props = $props();
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
</script>

<!-- Side Panel -->
<div
  id="bcx-side-panel"
  class="fixed inset-y-0 left-0 z-[999998] backdrop-blur-md font-medium text-white dark:text-white border-r transition-opacity duration-400 {animate ? (open ? 'side-panel-open' : 'side-panel-close') : (open ? '' : 'hidden')}"
>
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
            <div><kbd class="kbd">Ctrl+/</kbd> Open command menu</div>
            <div><kbd class="kbd">Ctrl+M</kbd> Search music</div>
            <div><kbd class="kbd">Ctrl+D</kbd> Toggle panel</div>
          </div>
        </div>
      </div>
    </div>
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

  :global(#bcx-side-panel) {
    background-color: rgb(31 41 55 / 56%);
    width: 400px;
  }

  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
      pointer-events: none;
    }
    to {
      transform: translateX(0);
      opacity: 1;
      pointer-events: auto;
    }
  }

  :global(.side-panel-open) {
    animation: slideInLeft 0.4s ease-out forwards;
  }

  :global(.side-panel-close) {
    display: none;
  }
</style>
