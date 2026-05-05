<script lang="ts">
import { X } from '@lucide/svelte';
import { TreeData, type TreeDataSection } from 'src/app/treeview/TreeData';
import type { TreeItem } from 'src/app/treeview/TreeItem';
import { findItemByPath } from 'src/app/treeview/utils';
import iconUrl from 'src/assets/icons/icon-48.png';
import BCXDrawerButton from './BCXDrawerButton.svelte';
import BcxSection from './BcxSection.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

interface Props {
  treeData: TreeData;
  open?: boolean;
  browserPanel?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

let {
  treeData,
  open = false,
  browserPanel = false,
  onToggle = () => {},
  onClose = () => {},
}: Props = $props();
let treeBrowserRef: BcxTreeBrowser;
let treeSections = $derived(
  treeData.sections.filter((section) => !!section.itemPath),
);
let sectionTreeDataById: Record<string, TreeData> = $state({});

function handleClose() {
  onClose();
}

function createTreeDataForSection(section: TreeDataSection): TreeData {
  const item = findSectionItem(section);
  const sectionTreeData = new TreeData();

  if (item) {
    sectionTreeData.add(item);
  }

  return sectionTreeData;
}

function getTreeDataForSection(section: TreeDataSection): TreeData {
  return sectionTreeDataById[section.id] ?? new TreeData();
}

function findSectionItem(section: TreeDataSection): TreeItem | null {
  return section.itemPath
    ? findItemByPath(treeData.items, section.itemPath)
    : null;
}

$effect(() => {
  const nextSectionTreeDataById: Record<string, TreeData> = {};

  treeSections.forEach((section) => {
    nextSectionTreeDataById[section.id] = createTreeDataForSection(section);
  });

  sectionTreeDataById = nextSectionTreeDataById;
});

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
  class="bcx-side-panel-shell {open ? 'open' : ''} {browserPanel ? 'browser-panel' : ''}"
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

          {#if !browserPanel}
            <button
              type="button"
              class="bcx-side-panel-close-button"
              aria-label="Close BCX side panel"
              title="Close side panel"
              onclick={handleClose}
            >
              <X size="20" />
            </button>
          {/if}
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4">

          <div class="bcx-sections">
            {#each treeSections as section}
              <BcxSection
                title={section.label}
                defaultOpen={section.defaultOpen}
              >
                <div class="bcx-section-tree-browser">
                  <BcxTreeBrowser
                    bind:this={treeBrowserRef}
                    treeData={getTreeDataForSection(section)}
                    initialRootPath="0"
                    lockInitialRoot
                    showBreadcrumb={false}
                    showFilter={false}
                  />
                </div>
              </BcxSection>
            {/each}

            <BcxSection title="Extension Info">
              <div class="bcx-section-content">
                <p>
                  BCX enhances your Bandcamp experience with powerful search and filtering tools.
                </p>
                <div class="bcx-keyboard-shortcuts">
                  <h3>Keyboard Shortcuts</h3>
                  <div><kbd class="kbd">Ctrl+Shift+X</kbd> Toggle panel</div>
                </div>
              </div>
            </BcxSection>
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if !browserPanel}
    <BCXDrawerButton sidePanelOpen={open} {onToggle} />
  {/if}
</div>

<style>
  :global(.bcx-side-panel-shell) {
    --bcx-side-panel-width: 400px;
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 999999;
    width: calc(var(--bcx-side-panel-width) + 24px);
    transform: translateX(calc(var(--bcx-side-panel-width) * -1));
    transition: transform 260ms cubic-bezier(0.25, 0.8, 0.25, 1);
    pointer-events: none;
  }

  :global(.bcx-side-panel-shell.open) {
    transform: translateX(0);
  }

  :global(.bcx-side-panel-content) {
    background-color: rgb(31 41 55 / 85%);
    pointer-events: auto;
    width: var(--bcx-side-panel-width);
  }

  :global(.bcx-side-panel-shell.browser-panel) {
    height: 100vh;
    inset: 0;
    position: fixed;
    transform: none;
    width: 100vw;
  }

  :global(.bcx-side-panel-shell.browser-panel .bcx-side-panel-content) {
    backdrop-filter: none;
    background-color: rgb(31 41 55);
    inset: 0;
    width: 100vw;
  }

  :global(.bcx-side-panel-close-button) {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 6px;
    color: #f9fafb;
    cursor: pointer;
    display: inline-flex;
    height: 32px;
    justify-content: center;
    padding: 0;
    transition:
      background-color 160ms ease,
      color 160ms ease;
    width: 32px;
  }

  :global(.bcx-side-panel-close-button:hover),
  :global(.bcx-side-panel-close-button:focus-visible) {
    background: rgb(255 255 255 / 12%);
    color: #04b1fe;
    outline: none;
  }

  :global(.bcx-sections) {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.5rem;
  }

  :global(.bcx-section-tree-browser .bcx-tree-view) {
    padding: 0;
  }

  :global(.bcx-section-content) {
    color: rgb(209 213 219);
    font-size: 0.875rem;
    line-height: 1.45;
    padding: 0.5rem 0.5rem 0.75rem 1.5rem;
  }

  :global(.bcx-section-content p) {
    margin: 0 0 0.75rem;
  }

  :global(.bcx-section-content h3) {
    color: rgb(243 244 246);
    font-size: 0.875rem;
    font-weight: 700;
    margin: 0 0 0.375rem;
  }

  :global(.bcx-section-content .kbd) {
    background: #374151;
    border: 1px solid #4b5563;
    border-radius: 4px;
    color: #f9fafb;
    font-family: monospace;
    font-size: 0.75rem;
    padding: 2px 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.bcx-side-panel-shell) {
      transition: none;
    }

    :global(.bcx-side-panel-close-button) {
      transition: none;
    }
  }
</style>
