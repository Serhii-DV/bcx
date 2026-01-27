<script lang="ts">
import { PageMusic } from 'src/bandcamp/domain/page/page.music';
import { Button } from '$lib/components/ui/button';
import BcxTreeView from './BcxTreeView.svelte';
import type { TreeItem } from './types';

interface Props {
  pageMusic?: PageMusic;
  open?: boolean;
  onClose?: () => void;
}

let {
  pageMusic = undefined,
  open = false,
  onClose = () => {},
}: Props = $props();

// Demo tree data
const treeData: TreeItem[] = [];

if (pageMusic instanceof PageMusic) {
  const band = pageMusic.band;

  treeData.push({
    id: '2',
    label: 'Page Artists',
    open: true,
    children: band.metadata.artistNames.map(
      (artistName) =>
        ({
          label: artistName,
          open: false,
        }) as TreeItem,
    ),
  });
}

treeData.push({
  id: '1',
  label: 'Music Library',
  open: false,
  children: [
    {
      id: '1.1',
      label: 'Albums',
      children: [
        {
          id: '1.1.1',
          label: 'Rock',
          children: [
            { id: '1.1.1.1', label: 'Classic Rock' },
            { id: '1.1.1.2', label: 'Progressive Rock' },
            { id: '1.1.1.3', label: 'Alternative Rock' },
          ],
        },
        {
          id: '1.1.2',
          label: 'Electronic',
          children: [
            { id: '1.1.2.1', label: 'Ambient' },
            { id: '1.1.2.2', label: 'Techno' },
            { id: '1.1.2.3', label: 'Drum & Bass' },
          ],
        },
        { id: '1.1.3', label: 'Jazz' },
      ],
    },
    {
      id: '1.2',
      label: 'Artists',
      children: [
        { id: '1.2.1', label: 'Favorites' },
        { id: '1.2.2', label: 'Recently Played' },
        { id: '1.2.3', label: 'Discovered' },
      ],
    },
    { id: '1.3', label: 'Playlists' },
  ],
});

function handleTreeItemClick(item: TreeItem) {
  console.log('Tree item clicked:', item.label);
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
  <div class="fixed inset-y-0 left-0 z-[999998] w-80 bg-white/0 dark:bg-gray-800/0 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl">
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
      <div class="flex-1 overflow-y-auto p-4">
        <div class="space-y-4">

          <!-- Tree View Demo -->
          <div class="p-3 bg-gray-50/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
            <h3 class="font-medium text-gray-900 dark:text-white mb-3">Page Navigation</h3>
            <BcxTreeView items={treeData} onItemClick={handleTreeItemClick} />
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

      <!-- Footer -->
      <div class="border-t border-gray-200/30 dark:border-gray-700/30 p-4">
        <Button variant="destructive" onclick={onClose} class="w-full">
          Close Panel
        </Button>
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
