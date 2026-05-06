<script lang="ts">
import { X } from '@lucide/svelte';
import type { SidePanelSection } from 'src/app/treeview/SidePanelSection';
import { TreeData } from 'src/app/treeview/TreeData';
import { TREE_ITEM_LAYOUT, type TreeItem } from 'src/app/treeview/TreeItem';
import { buildBreadcrumbItems, isNode } from 'src/app/treeview/utils';
import { ICON_INFO } from 'src/app/treeview/utils/icon';
import iconUrl from 'src/assets/icons/icon-48.png';
import BCXDrawerButton from './BCXDrawerButton.svelte';
import BcxSection from './BcxSection.svelte';
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
let sectionRootPathById: Record<string, string | null> = $state({});
let globalFilterQuery = $state('');
let currentSections: SidePanelSection[] | null = null;
let sectionLoadGeneration = 0;
let globalFilterSuggestions = $derived.by(() => {
  const suggestions = new Set<string>(sections.map((section) => section.label));

  Object.values(sectionTreeDataById).forEach((sectionTreeData) => {
    sectionTreeData.filterSuggestions.forEach((suggestion) =>
      suggestions.add(suggestion),
    );
  });

  return Array.from(suggestions).sort();
});

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

function getSectionIcon(section: SidePanelSection): string | undefined {
  const image = section.image;
  return image && !image.includes('/') ? image : undefined;
}

function getSectionImage(section: SidePanelSection): string | undefined {
  const image = section.image;
  return image && image.includes('/') ? image : undefined;
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
  } finally {
    if (loadGeneration === sectionLoadGeneration) {
      sectionLoadingById = {
        ...sectionLoadingById,
        [section.id]: false,
      };
    }
  }
}

async function handleSectionOpenChange(
  section: SidePanelSection,
  open: boolean,
) {
  if (!open) {
    return;
  }

  await loadSectionTreeData(section);
}

function handleGlobalFilterArrowDown() {
  focusFirstSectionHeader();
}

function focusFirstSectionHeader() {
  sectionsContainer?.querySelector<HTMLElement>('.bcx-section-header')?.focus();
}

$effect(() => {
  if (sections === currentSections) {
    return;
  }

  currentSections = sections;
  sectionLoadGeneration += 1;
  sectionTreeDataById = {};
  sectionLoadingById = {};
  sectionRootPathById = {};
});

$effect(() => {
  sections.forEach((section) => {
    if (section.defaultOpen && !sectionTreeDataById[section.id]) {
      void loadSectionTreeData(section);
    }
  });
});

$effect(() => {
  if (!globalFilterQuery.trim()) {
    return;
  }

  sections.forEach((section) => {
    if (!sectionTreeDataById[section.id]) {
      void loadSectionTreeData(section);
    }
  });
});

// Focus first item when panel opens
$effect(() => {
  if (open) {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      focusFirstSectionHeader();
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
            <BcxTreeBrowserFilter
              bind:value={globalFilterQuery}
              suggestions={globalFilterSuggestions}
              onArrowDown={handleGlobalFilterArrowDown}
            />

            {#each sections as section}
              <BcxSection
                title={section.label}
                icon={getSectionIcon(section)}
                image={getSectionImage(section)}
                defaultOpen={section.defaultOpen}
                onOpenChange={(open) => handleSectionOpenChange(section, open)}
              >
                <div class="bcx-section-tree-browser">
                  {#if shouldShowBreadcrumb(section)}
                    <BcxTreeBreadcrumb
                      items={getBreadcrumbItemsForSection(section)}
                      currentPath={getRootPathForSection(section)}
                      onNavigate={(path) => setRootPathForSection(section, path)}
                    />
                  {/if}
                  <BcxTreeBrowser
                    treeData={getTreeDataForSection(section)}
                    isLoading={isSectionLoading(section)}
                    filterQuery={globalFilterQuery}
                    bind:rootPath={sectionRootPathById[section.id]}
                    showBreadcrumb={false}
                    showFilter={false}
                  />
                </div>
              </BcxSection>
            {/each}

            <BcxSection title="Extension Info" icon={ICON_INFO} height="10rem">
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
