<script lang="ts">
import { Button } from '$lib/components/ui/button';

interface Props {
  open?: boolean;
  onSearchMusic?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onClose?: () => void;
}

let {
  open = false,
  onSearchMusic = () => {},
  onProfile = () => {},
  onSettings = () => {},
  onClose = () => {},
}: Props = $props();
</script>

{#if open}
  <!-- Overlay -->
  <div
    class="fixed inset-0 z-[999997] bg-black/30"
    onclick={onClose}
  ></div>

  <!-- Side Panel -->
  <div class="fixed inset-y-0 left-0 z-[999998] w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl">
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">BCX Side Panel</h2>
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
          <!-- Quick Actions -->
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Quick Actions</h3>
            <div class="space-y-2">
              <Button class="w-full" size="sm" onclick={onSearchMusic}>
                Search Music
              </Button>
              <Button variant="outline" class="w-full" size="sm" onclick={onProfile}>
                Profile
              </Button>
              <Button variant="outline" class="w-full" size="sm" onclick={onSettings}>
                Settings
              </Button>
            </div>
          </div>

          <!-- Extension Info -->
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Extension Info</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              BCX enhances your Bandcamp experience with powerful search and filtering tools.
            </p>
          </div>

          <!-- Keyboard Shortcuts -->
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
      <div class="border-t border-gray-200 dark:border-gray-700 p-4">
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
