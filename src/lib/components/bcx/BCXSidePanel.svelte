<script lang="ts">
import { TreeData } from 'src/app/treeview/treeData';
import type { TreeItem } from 'src/app/treeview/treeItem';
import { musicFilterStore } from '$lib/stores/musicFilter';
import BcxTreeView from './BcxTreeView.svelte';

interface Props {
  treeData: TreeData;
  open?: boolean;
  onClose?: () => void;
}

let { treeData, open = false, onClose = () => {} }: Props = $props();

function handleTreeItemClick(item: TreeItem, event?: MouseEvent) {
  if (event?.currentTarget instanceof HTMLAnchorElement) {
    event?.preventDefault();
  }
  musicFilterStore.setSearchQuery(item.label);
}
</script>

{#if open}
  <!-- Overlay -->
  <button
    class="fixed inset-0 z-[999997] bg-black/30"
    onclick={onClose}
    aria-label="Close"
  ></button>

  <!-- Side Panel -->
  <div class="fixed inset-y-0 left-0 z-[999998] w-100 bg-white/0 dark:bg-gray-800/0 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl">
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="border-b border-gray-200/30 dark:border-gray-700/30 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white dark:text-white">BCX Side Panel</h2>
          <button
            onclick={onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4">

          <!-- Tree View Demo -->
          <div class="text-md font-medium text-white" style="background-color: #24282a">
            <BcxTreeView treeData={treeData} onItemClick={handleTreeItemClick} />
          </div>

          <!-- Extension Info -->
          <div class="p-3 bg-gray-50/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Extension Info</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              BCX enhances your Bandcamp experience with powerful search and filtering tools.
            </p>
          </div>

          <!-- Keyboard Shortcuts -->
          <div class="p-3 bg-gray-50/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Keyboard Shortcuts</h3>
            <div class="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <div><kbd class="kbd">Ctrl+/</kbd> Open command menu</div>
              <div><kbd class="kbd">Ctrl+M</kbd> Search music</div>
              <div><kbd class="kbd">Ctrl+D</kbd> Toggle panel</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

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
</style>
