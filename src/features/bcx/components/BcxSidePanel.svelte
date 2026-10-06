<script lang="ts">
import {
  fanStorage,
  libraryKey,
  SAVED_LIST_OWNERS_KEY,
} from 'src/bandcamp/domain/fanData/library';
import {
  FAN_SYNC_JOB_KEY,
  type FanSyncJob,
} from 'src/bandcamp/domain/fanData/sync';
import type { SidePanelHeader } from 'src/features/bcx/sidePanelHeader';
import type { SidePanelSection } from 'src/features/treeview/SidePanelSection';
import { TreeData } from 'src/features/treeview/TreeData';
import {
  hasItemPreview,
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { buildBreadcrumbItems, isNode } from 'src/features/treeview/utils';
import {
  ICON_DATABASE,
  ICON_HISTORY,
  ICON_INFO,
  ICON_REFRESH_CCW,
} from 'src/features/treeview/utils/icon';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount, untrack } from 'svelte';
import BcxActivityLog from './BcxActivityLog.svelte';
import BcxBandPanel from './BcxBandPanel.svelte';
import BcxDrawerButton from './BcxDrawerButton.svelte';
import BcxExtensionInfo from './BcxExtensionInfo.svelte';
import BcxFanDataSync from './BcxFanDataSync.svelte';
import BcxItemPreviewPanel from './BcxItemPreviewPanel.svelte';
import BcxMainNavigation from './BcxMainNavigation.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import BcxSidePanelHeader from './BcxSidePanelHeader.svelte';
import BcxStoragePanel from './BcxStoragePanel.svelte';
import BcxTreeBreadcrumb from './BcxTreeBreadcrumb.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';
import BcxTreeBrowserFilter from './BcxTreeBrowserFilter.svelte';

interface Props {
  sections: SidePanelSection[];
  header?: SidePanelHeader | null;
  open?: boolean;
  browserPanel?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

let {
  sections,
  header = null,
  open = false,
  browserPanel = false,
  onToggle = () => {},
  onClose = () => {},
}: Props = $props();
let sectionsContainer: HTMLDivElement;
let mainNavigation = $state<BcxMainNavigation>();
const mainContentId = $props.id();
let sectionTreeDataById: Record<string, TreeData> = $state({});
let sectionLoadingById: Record<string, boolean> = $state({});
let sectionErrorById: Record<string, string> = $state({});
let sectionRootPathById: Record<string, string | null> = $state({});
const infoTabId = '__extension-info__';
const storageTabId = '__storage__';
const syncTabId = '__fan-sync__';
const activityTabId = '__activity-log__';
function viewActivity() {
  selectedSectionId = activityTabId;
}
let selectedSectionId = $state('');
let fanSyncJob = $state<FanSyncJob>();
let fanSyncError = $state('');
const hasFanSync = $derived(sections.some((section) => !!section.fanSync));
const syncAccount = $derived(
  sections.find((section) => section.fanSync?.account)?.fanSync?.account,
);
const accountSyncJob = $derived(
  syncAccount && fanSyncJob?.account.fanId === syncAccount.fanId
    ? fanSyncJob
    : undefined,
);
let sectionFilterQueryById: Record<string, string> = $state({});
let currentSections: SidePanelSection[] | null = null;
let sectionLoadGeneration = 0;
const sectionRequests = new Map<string, number>();

const sectionTitles: Record<string, string> = {
  Collection: 'Browse releases in your Bandcamp collection.',
  Wishlist: 'Browse releases saved to your Bandcamp wishlist.',
  History: 'Revisit Bandcamp artists, labels, and releases you have viewed.',
  'Following Bands': 'Browse artists and labels you follow on Bandcamp.',
  'Following Genres': 'Browse genres you follow on Bandcamp.',
};

function getSectionTitle(section: SidePanelSection): string {
  if (section.id.startsWith('band-'))
    return `Browse releases and artist or label information for ${section.label}.`;
  if (section.id.startsWith('fan-'))
    return `Browse the collection and wishlist of ${section.label.replace(/^Fan: /, '')}.`;
  return sectionTitles[section.label] ?? `Browse ${section.label}.`;
}

const navigationSections = $derived(
  sections.map((section) => ({ ...section, title: getSectionTitle(section) })),
);
const navigationTools = $derived([
  ...(hasFanSync
    ? [
        {
          id: syncTabId,
          label: 'Sync',
          image: ICON_REFRESH_CCW,
          title: 'Sync your saved Bandcamp data and view sync progress.',
        },
      ]
    : []),
  {
    id: storageTabId,
    label: 'Storage',
    image: ICON_DATABASE,
    title: 'View extension storage usage, saved data, and daily history.',
  },
  {
    id: activityTabId,
    label: 'Activity log',
    image: ICON_HISTORY,
    title: 'View extension process progress, outcomes, and recent logs.',
  },
  {
    id: infoTabId,
    label: 'Extension Info',
    image: ICON_INFO,
    title: 'Learn about BCX features and keyboard shortcuts.',
  },
]);
const selectedNavigationSection = $derived(
  [...navigationSections, ...navigationTools].find(
    (section) => section.id === selectedSectionId,
  ),
);
const navigationSyncStatus = $derived(
  hasFanSync
    ? fanSyncError || accountSyncJob?.state === 'error'
      ? 'error'
      : fanSyncJob?.state === 'running'
        ? 'running'
        : undefined
    : undefined,
);

function getTreeDataForSection(section: SidePanelSection): TreeData {
  return sectionTreeDataById[section.id] ?? new TreeData();
}

function containsPreviewItems(items: TreeItem[]): boolean {
  return items.some(
    (item) =>
      hasItemPreview(item) ||
      item.itemPreview ||
      item.releasePreview ||
      !!item.aboutProfile ||
      !!item.loadChildren ||
      (item.children && containsPreviewItems(item.children)),
  );
}

const showPreview = $derived.by(() => {
  const section = sections.find((section) => section.id === selectedSectionId);
  if (!section || section.label === 'Following Genres') return false;
  const data = sectionTreeDataById[section.id];
  return data ? containsPreviewItems(data.items) : true;
});

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

async function loadSectionTreeData(section: SidePanelSection, force = false) {
  if (
    !force &&
    (sectionTreeDataById[section.id] || sectionLoadingById[section.id])
  ) {
    return;
  }

  sectionErrorById = { ...sectionErrorById, [section.id]: '' };
  const loadGeneration = sectionLoadGeneration;
  const request = (sectionRequests.get(section.id) ?? 0) + 1;
  sectionRequests.set(section.id, request);
  sectionLoadingById = {
    ...sectionLoadingById,
    [section.id]: true,
  };

  try {
    const sectionTreeData = await section.createTreeData();

    if (
      loadGeneration !== sectionLoadGeneration ||
      sectionRequests.get(section.id) !== request
    ) {
      return;
    }

    sectionTreeDataById = {
      ...sectionTreeDataById,
      [section.id]: sectionTreeData,
    };
  } catch (error) {
    if (
      loadGeneration === sectionLoadGeneration &&
      sectionRequests.get(section.id) === request
    ) {
      sectionErrorById = {
        ...sectionErrorById,
        [section.id]:
          error instanceof Error ? error.message : 'Failed to load section',
      };
    }
  } finally {
    if (
      loadGeneration === sectionLoadGeneration &&
      sectionRequests.get(section.id) === request
    ) {
      sectionLoadingById = {
        ...sectionLoadingById,
        [section.id]: false,
      };
    }
  }
}

onMount(() => {
  const pending = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let jobReadGeneration = 0;
  const refreshSyncJob = async () => {
    const generation = ++jobReadGeneration;
    try {
      const job = await fanStorage().getByKey<FanSyncJob>(FAN_SYNC_JOB_KEY);
      if (generation === jobReadGeneration) {
        fanSyncJob = job;
        fanSyncError = '';
      }
    } catch (reason) {
      if (generation === jobReadGeneration)
        fanSyncError = getErrorMessage(reason, 'Could not read sync status.');
    }
  };
  void refreshSyncJob();
  const changed = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'local') return;
    if (FAN_SYNC_JOB_KEY in changes) void refreshSyncJob();
    for (const section of sections) {
      const account = section.fanSync?.account ?? section.fanAccount;
      if (
        (account && libraryKey(account.fanId) in changes) ||
        (section.fanSync &&
          (`/${section.fanSync.dataset}` in changes ||
            SAVED_LIST_OWNERS_KEY in changes))
      )
        pending.add(section.id);
    }
    if (!pending.size) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      for (const section of sections) {
        if (
          pending.has(section.id) &&
          (sectionTreeDataById[section.id] ||
            sectionLoadingById[section.id] ||
            selectedSectionId === section.id)
        ) {
          void loadSectionTreeData(section, true);
        }
      }
      pending.clear();
    }, 100);
  };
  chrome.storage.onChanged.addListener(changed);
  return () => {
    sectionLoadGeneration++;
    jobReadGeneration++;
    clearTimeout(timer);
    chrome.storage.onChanged.removeListener(changed);
  };
});

function handleSectionFilterArrowDown() {
  sectionsContainer
    ?.querySelector<HTMLElement>(
      '[data-bcx-main-section]:not([hidden]) .tree-item',
    )
    ?.focus();
}

function focusSelectedSection() {
  if (
    sectionsContainer?.contains(document.activeElement) &&
    document.activeElement?.classList.contains('tree-item')
  )
    return;
  mainNavigation?.focusSelected();
}

$effect(() => {
  if (sections === currentSections) {
    return;
  }

  currentSections = sections;
  if (
    selectedSectionId !== infoTabId &&
    selectedSectionId !== storageTabId &&
    selectedSectionId !== activityTabId &&
    !(selectedSectionId === syncTabId && hasFanSync) &&
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

// Focus the selected navigation section when the panel opens.
$effect(() => {
  if (open) {
    // Use setTimeout to ensure DOM is ready
    const timeout = setTimeout(focusSelectedSection, 100);
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
      <!-- Content -->
      <div class="bcx-panel-body">
        <div class="bcx-panel-body">

          <div bind:this={sectionsContainer} class="bcx-sections">
            <div class="bcx-panel-body bcx-main-layout">
              <BcxMainNavigation
                bind:this={mainNavigation}
                sections={navigationSections}
                tools={navigationTools}
                bind:value={selectedSectionId}
                contentId={mainContentId}
                syncStatus={navigationSyncStatus}
              />
              <div class="bcx-panel-body">
              <BcxSidePanelHeader {header} showCloseButton={!browserPanel} {onClose} />
              {#if selectedNavigationSection}
                <h3 class="bcx-main-section-title" title={selectedNavigationSection.title}>{selectedNavigationSection.label}</h3>
              {/if}
              <BcxItemPreviewPanel visible={showPreview}>
              {#each sections as section (section.id)}
                <div id={`${mainContentId}-${section.id}`} data-bcx-main-section role="region" aria-label={section.label} hidden={selectedSectionId !== section.id} class="bcx-tab-content">
                  {#if section.fanSync && (fanSyncJob?.state === 'running' || accountSyncJob?.state === 'error')}
                    <div class="bcx-sync-indicator" role={accountSyncJob?.state === 'error' ? 'alert' : 'status'}>
                      <span>{accountSyncJob?.state === 'error' ? 'Sync needs attention.' : 'Sync in progress…'}</span>
                      <button onclick={() => (selectedSectionId = syncTabId)}>View sync</button>
                    </div>
                  {/if}
                  {#if section.fanSync}
                    {#if sectionErrorById[section.id]}<p role="alert" class="bcx-section-content">{sectionErrorById[section.id]}</p>{/if}
                  {/if}
                  {#if sectionTreeDataById[section.id] || selectedSectionId === section.id}
                    {#if section.rootNavigation === 'tabs' && sectionTreeDataById[section.id]}
                      {#if section.fanSync || section.fanAccount}
                        <BcxRootSectionTabs treeData={sectionTreeDataById[section.id]} label={`${section.label} sections`} initialSelectedHref={section.initialSelectedHref} sortBands={section.label === 'Following Bands'} responsiveSidebar={true} />
                      {:else}
                      {#key sectionTreeDataById[section.id]}
                        {#if section.id.startsWith('band-')}
                          <BcxBandPanel treeData={sectionTreeDataById[section.id]} initialSelectedHref={section.initialSelectedHref} />
                        {:else}
                          <BcxRootSectionTabs treeData={sectionTreeDataById[section.id]} label={`${section.label} sections`} initialSelectedHref={section.initialSelectedHref} sortBands={section.label === 'Following Bands'} responsiveSidebar={true} />
                        {/if}
                      {/key}
                      {/if}
                    {:else}
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
                            initialSelectedHref={section.initialSelectedHref}
                            nativeTabNavigation={showPreview}
                          />
                        {/if}
                      </div>
                    {/if}
                  {/if}
                </div>
              {/each}

              {#if hasFanSync}
                <div id={`${mainContentId}-${syncTabId}`} data-bcx-main-section role="region" aria-label="Sync" hidden={selectedSectionId !== syncTabId} class="bcx-tab-content bcx-info-scroll">
                  <BcxFanDataSync account={syncAccount} job={fanSyncJob} jobReadError={fanSyncError} onViewLog={viewActivity} />
                </div>
              {/if}

              <div id={`${mainContentId}-${storageTabId}`} data-bcx-main-section role="region" aria-label="Storage" hidden={selectedSectionId !== storageTabId} class="bcx-tab-content">
                {#if selectedSectionId === storageTabId}<BcxStoragePanel onViewLog={viewActivity} />{/if}
              </div>

              <div id={`${mainContentId}-${activityTabId}`} data-bcx-main-section role="region" aria-label="Activity log" hidden={selectedSectionId !== activityTabId} class="bcx-tab-content">
                {#if selectedSectionId === activityTabId}<BcxActivityLog />{/if}
              </div>

              <div id={`${mainContentId}-${infoTabId}`} data-bcx-main-section role="region" aria-label="Extension Info" hidden={selectedSectionId !== infoTabId} class="bcx-tab-content bcx-info-scroll">
                <BcxExtensionInfo />
              </div>
              </BcxItemPreviewPanel>
              </div>
            </div>
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
    --bcx-preview-gutter: 1rem;
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

  :global(.bcx-side-panel-shell .bcx-panel-body),
  :global(.bcx-side-panel-shell .bcx-sections),
  :global(.bcx-side-panel-shell .bcx-tab-content:not([hidden])),
  :global(.bcx-side-panel-shell .bcx-section-tree-browser) {
    display: flex;
    flex: 1 1 0%;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  :global(.bcx-side-panel-shell .bcx-tab-content[hidden]) {
    display: none;
  }

  :global(.bcx-side-panel-shell .bcx-main-layout) {
    position: relative;
    flex-direction: row;
  }

  .bcx-main-section-title {
    flex-shrink: 0;
    margin: 0 var(--bcx-preview-gutter, 16px);
    padding: 4px 0;
    overflow: hidden;
    color: #f9fafb;
    font-size: 0.875rem;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.bcx-side-panel-shell .bcx-tab-content.bcx-info-scroll:not([hidden])) {
    overflow-y: auto;
  }

  :global(.bcx-side-panel-shell :is(.bcx-tree-view, .item-preview-panel-content, .bcx-info-scroll, .bcx-section-overflow)) {
    scrollbar-color: rgb(156 163 175 / 0.45) transparent;
    scrollbar-width: thin;
  }

  :global(.bcx-side-panel-shell :is(.bcx-tree-view, .item-preview-panel-content, .bcx-info-scroll, .bcx-section-overflow)::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
  }

  :global(.bcx-side-panel-shell :is(.bcx-tree-view, .item-preview-panel-content, .bcx-info-scroll, .bcx-section-overflow)::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(.bcx-side-panel-shell :is(.bcx-tree-view, .item-preview-panel-content, .bcx-info-scroll, .bcx-section-overflow)::-webkit-scrollbar-button) {
    display: none;
    width: 0;
    height: 0;
  }

  :global(.bcx-side-panel-shell :is(.bcx-tree-view, .item-preview-panel-content, .bcx-info-scroll, .bcx-section-overflow)::-webkit-scrollbar-thumb) {
    border-radius: 9999px;
    background-color: rgb(156 163 175 / 0.35);
  }

  :global(.bcx-side-panel-shell :is(.bcx-tree-view, .item-preview-panel-content, .bcx-info-scroll, .bcx-section-overflow)::-webkit-scrollbar-thumb:hover) {
    background-color: rgb(209 213 219 / 0.55);
  }

  :global(.bcx-side-panel-shell :is(.bcx-tree-view, .item-preview-panel-content, .bcx-info-scroll, .bcx-section-overflow)::-webkit-scrollbar-corner) {
    background: transparent;
  }

  :global(.bcx-side-panel-shell .bcx-tree-breadcrumb) {
    flex-shrink: 0;
  }

  .bcx-sync-indicator {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 8px;
    color: #d1d5db;
    font-size: 0.75rem;
  }

  .bcx-sync-indicator button {
    color: #7dd3fc;
    cursor: pointer;
    text-decoration: underline;
  }

  .bcx-sync-indicator button:focus-visible {
    outline: 2px solid #04b1fe;
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
  }
</style>
