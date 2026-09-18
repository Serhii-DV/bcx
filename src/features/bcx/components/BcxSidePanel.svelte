<script lang="ts">
import { X } from '@lucide/svelte';
import { Tabs } from 'bits-ui';
import iconUrl from 'src/assets/icons/icon-48.png';
import type { SidePanelSection } from 'src/features/treeview/SidePanelSection';
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { buildBreadcrumbItems, isNode } from 'src/features/treeview/utils';
import { ICON_INFO } from 'src/features/treeview/utils/icon';
import { untrack } from 'svelte';
import BcxDrawerButton from './BcxDrawerButton.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxTreeBreadcrumb from './BcxTreeBreadcrumb.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';
import BcxTreeBrowserFilter from './BcxTreeBrowserFilter.svelte';

interface Props {
  sections: SidePanelSection[];
  open?: boolean;
  browserPanel?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

let {
  sections,
  open = false,
  browserPanel = false,
  onToggle = () => {},
  onClose = () => {},
}: Props = $props();
let sectionsContainer: HTMLDivElement;
let sectionTreeDataById: Record<string, TreeData> = $state({});
let sectionLoadingById: Record<string, boolean> = $state({});
let sectionErrorById: Record<string, string> = $state({});
let sectionRootPathById: Record<string, string | null> = $state({});
const infoTabId = '__extension-info__';
let selectedSectionId = $state('');
let sectionFilterQueryById: Record<string, string> = $state({});
let currentSections: SidePanelSection[] | null = null;
let sectionLoadGeneration = 0;

function handleClose() {
  onClose();
}

function getTreeDataForSection(section: SidePanelSection): TreeData {
  return sectionTreeDataById[section.id] ?? new TreeData();
}

function getRootPathForSection(section: SidePanelSection): string | null {
  return sectionRootPathById[section.id] ?? null;
}

function setRootPathForSection(section: SidePanelSection, path: string | null) {
  sectionRootPathById = {
    ...sectionRootPathById,
    [section.id]: path,
  };
}

function isSectionLoading(section: SidePanelSection): boolean {
  return sectionLoadingById[section.id] ?? false;
}

function getBreadcrumbItemsForSection(section: SidePanelSection): TreeItem[] {
  const rootPath = getRootPathForSection(section);

  if (!rootPath) {
    return [];
  }

  return buildBreadcrumbItems(getTreeDataForSection(section).items, rootPath);
}

function startsInTreeLayout(section: SidePanelSection): boolean {
  return getTreeDataForSection(section).layout === TREE_ITEM_LAYOUT.TREE;
}

function hasRootItemsWithChildren(section: SidePanelSection): boolean {
  return getTreeDataForSection(section).items.some(isNode);
}

function shouldShowBreadcrumb(section: SidePanelSection): boolean {
  return !startsInTreeLayout(section) && hasRootItemsWithChildren(section);
}

async function loadSectionTreeData(section: SidePanelSection) {
  if (sectionTreeDataById[section.id] || sectionLoadingById[section.id]) {
    return;
  }

  sectionErrorById = { ...sectionErrorById, [section.id]: '' };
  const loadGeneration = sectionLoadGeneration;
  sectionLoadingById = {
    ...sectionLoadingById,
    [section.id]: true,
  };

  try {
    const sectionTreeData = await section.createTreeData();

    if (loadGeneration !== sectionLoadGeneration) {
      return;
    }

    sectionTreeDataById = {
      ...sectionTreeDataById,
      [section.id]: sectionTreeData,
    };
  } catch (error) {
    if (loadGeneration === sectionLoadGeneration) {
      sectionErrorById = {
        ...sectionErrorById,
        [section.id]:
          error instanceof Error ? error.message : 'Failed to load section',
      };
    }
  } finally {
    if (loadGeneration === sectionLoadGeneration) {
      sectionLoadingById = {
        ...sectionLoadingById,
        [section.id]: false,
      };
    }
  }
}

function handleSectionFilterArrowDown() {
  sectionsContainer
    ?.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden]) .tree-item')
    ?.focus();
}

function focusSelectedTab() {
  sectionsContainer
    ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    ?.focus();
}

$effect(() => {
  if (sections === currentSections) {
    return;
  }

  currentSections = sections;
  if (
    selectedSectionId !== infoTabId &&
    !sections.some((section) => section.id === selectedSectionId)
  ) {
    selectedSectionId =
      sections.find((section) => section.defaultOpen)?.id ??
      sections[0]?.id ??
      infoTabId;
  }
  sectionLoadGeneration += 1;
  sectionTreeDataById = {};
  sectionLoadingById = {};
  sectionErrorById = {};
  sectionRootPathById = {};
  sectionFilterQueryById = Object.fromEntries(
    sections.map((section) => [section.id, '']),
  );
});

$effect(() => {
  const section = sections.find((section) => section.id === selectedSectionId);
  if (section) {
    untrack(() => void loadSectionTreeData(section));
  }
});

// Focus the selected tab when the panel opens
$effect(() => {
  if (open) {
    // Use setTimeout to ensure DOM is ready
    const timeout = setTimeout(focusSelectedTab, 100);
    return () => clearTimeout(timeout);
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
      <div class="p-4">
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

          <div bind:this={sectionsContainer} class="bcx-sections">
            <Tabs.Root bind:value={selectedSectionId}>
              <BcxSectionTabs
                tabs={[...sections, { id: infoTabId, label: 'Extension Info', image: ICON_INFO }]}
                bind:value={selectedSectionId}
              />
              {#each sections as section (section.id)}
                <Tabs.Content value={section.id}>
                  {#if sectionTreeDataById[section.id] || selectedSectionId === section.id}
                    <BcxTreeBrowserFilter
                      bind:value={sectionFilterQueryById[section.id]}
                      suggestions={getTreeDataForSection(section).filterSuggestions}
                      onArrowDown={handleSectionFilterArrowDown}
                    />
                    <div class="bcx-section-tree-browser">
                      {#if shouldShowBreadcrumb(section)}
                        <BcxTreeBreadcrumb
                          items={getBreadcrumbItemsForSection(section)}
                          currentPath={getRootPathForSection(section)}
                          onNavigate={(path) => setRootPathForSection(section, path)}
                        />
                      {/if}
                      {#if sectionErrorById[section.id]}
                        <p role="alert" class="bcx-section-content">{sectionErrorById[section.id]}</p>
                      {:else}
                        <BcxTreeBrowser
                          treeData={getTreeDataForSection(section)}
                          isLoading={isSectionLoading(section)}
                          filterQuery={sectionFilterQueryById[section.id] ?? ''}
                          bind:rootPath={sectionRootPathById[section.id]}
                          showBreadcrumb={false}
                          showFilter={false}
                        />
                      {/if}
                    </div>
                  {/if}
                </Tabs.Content>
              {/each}

              <Tabs.Content value={infoTabId}>
                <div class="bcx-section-content">
                  <p>
                    BCX enhances your Bandcamp experience with powerful search and filtering tools.
                  </p>
                  <div class="bcx-keyboard-shortcuts">
                    <h3>Keyboard Shortcuts</h3>
                    <div><kbd class="kbd">Ctrl+Shift+X</kbd> Toggle panel</div>
                  </div>
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if !browserPanel}
    <BcxDrawerButton sidePanelOpen={open} {onToggle} />
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
