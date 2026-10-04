<script lang="ts">
import { Check, ChevronDown, Ellipsis } from '@lucide/svelte';
import { DropdownMenu, Tabs } from 'bits-ui';
import { makeIcon } from 'src/features/treeview/utils/icon';
import { type Snippet, tick } from 'svelte';
import { getVisibleSectionTabIds } from './sectionTabOverflow';

interface SectionTab {
  id: string;
  label: string;
  image?: string;
  title?: string;
  sortOptions?: { id: string; label: string; title?: string }[];
  sortValue?: string;
  sortLabel?: string;
  onSortChange?: (id: string) => void;
}

let {
  tabs,
  value = $bindable(),
  label = 'Music Explorer sections',
  actions,
  wrapActions = false,
}: {
  tabs: SectionTab[];
  value: string;
  label?: string;
  actions?: Snippet;
  wrapActions?: boolean;
} = $props();
let bar = $state<HTMLDivElement>();
let actionsElement = $state<HTMLDivElement>();
let measurements: HTMLDivElement;
let moreMeasurement: HTMLSpanElement;
let visibleIds = $state<string[]>([]);
let focusSelectedOnClose = false;
let lastSortId = $state('');
const visibleTabs = $derived(tabs.filter((tab) => visibleIds.includes(tab.id)));
const hiddenTabs = $derived(tabs.filter((tab) => !visibleIds.includes(tab.id)));

$effect(() => {
  if (
    tabs.some((tab) => tab.sortOptions?.some((option) => option.id === value))
  ) {
    lastSortId = value;
  }
});

// Measure all labels independently of which tabs are currently visible.
$effect(() => {
  const barElement = bar;
  if (!barElement) return;
  const currentTabs = tabs;
  const currentActions = actionsElement;
  const activeId =
    currentTabs.find((tab) =>
      tab.sortOptions?.some((option) => option.id === value),
    )?.id ?? value;
  const measure = () => {
    const widths = Array.from(
      measurements.children,
      (element) => element.getBoundingClientRect().width,
    );
    visibleIds = getVisibleSectionTabIds(
      currentTabs.map((tab, index) => ({ ...tab, width: widths[index] ?? 0 })),
      activeId,
      barElement.clientWidth -
        8 -
        (currentActions && getComputedStyle(currentActions).flexBasis !== '100%'
          ? currentActions.getBoundingClientRect().width + 4
          : 0),
      moreMeasurement.getBoundingClientRect().width,
    );
  };
  const observer = new ResizeObserver(measure);
  observer.observe(barElement);
  observer.observe(measurements);
  if (currentActions) observer.observe(currentActions);
  measure();
  return () => observer.disconnect();
});

function onSelectSortOption(tab: SectionTab, id: string) {
  focusSelectedOnClose = true;
  tab.onSortChange?.(id);
  value = tab.onSortChange ? tab.id : id;
}

function selectedSortOption(tab: SectionTab) {
  return (
    tab.sortOptions?.find((option) => option.id === (tab.sortValue ?? value)) ??
    tab.sortOptions?.find((option) => option.id === lastSortId)
  );
}

function tabLabelText(tab: SectionTab) {
  const sort = selectedSortOption(tab) ?? tab.sortOptions?.[0];
  return sort ? `${tab.label} · ${sort.label}` : tab.label;
}

function tabTitle(tab: SectionTab) {
  return selectedSortOption(tab)?.title ?? tab.title ?? tabLabelText(tab);
}

async function handleCloseAutoFocus(event: Event) {
  if (!focusSelectedOnClose) return;
  event.preventDefault();
  focusSelectedOnClose = false;
  await tick();
  bar
    ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    ?.focus();
}
</script>

{#snippet tabLabel(tab: SectionTab)}
  {@const Icon = makeIcon(tab.image?.includes('/') ? undefined : tab.image)}
  {#if Icon}
    <Icon size={16} class="shrink-0" aria-hidden="true" />
  {:else if tab.image}
    <img src={tab.image} alt="" class="size-4 shrink-0 rounded-sm object-cover" />
  {/if}
  <span class="bcx-tab-label">{tabLabelText(tab)}</span>
{/snippet}

<div bind:this={bar} class="bcx-section-tabs" class:wrap-actions={wrapActions} class:actions-only={!tabs.length} role={tabs.length ? undefined : 'group'} aria-label={tabs.length ? undefined : label}>
  {#if tabs.length}
  <Tabs.List class="bcx-visible-tabs" aria-label={label}>
    {#each visibleTabs as tab (tab.id)}
      {#if tab.sortOptions}
        <div class="bcx-sort-tab-group">
          <Tabs.Trigger value={tab.onSortChange ? tab.id : selectedSortOption(tab)?.id ?? tab.id} class="bcx-section-tab" title={tabTitle(tab)}>
            {@render tabLabel(tab)}
          </Tabs.Trigger>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="bcx-section-tab bcx-sort-button" aria-label={tab.sortLabel ?? 'Sort followed bands'} title={tab.sortLabel ?? 'Choose how followed bands are ordered'}>
              <ChevronDown size={14} aria-hidden="true" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal to={bar?.closest('.bcx-side-panel-shell') ?? undefined}>
              <DropdownMenu.Content class="bcx-section-overflow" align="start" sideOffset={6} strategy="fixed" onCloseAutoFocus={handleCloseAutoFocus}>
                {#each tab.sortOptions as option (option.id)}
                  <DropdownMenu.Item class="bcx-section-menu-item" aria-label={`${option.label}${selectedSortOption(tab)?.id === option.id ? ', selected' : ''}`} title={option.title} onSelect={() => onSelectSortOption(tab, option.id)}>
                    <span class="bcx-sort-check">{#if selectedSortOption(tab)?.id === option.id}<Check size={14} aria-hidden="true" />{/if}</span>
                    {option.label}
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      {:else}
        <Tabs.Trigger value={tab.id} class="bcx-section-tab" title={tabTitle(tab)}>
          {@render tabLabel(tab)}
        </Tabs.Trigger>
      {/if}
    {/each}
  </Tabs.List>
  {/if}
  {#if hiddenTabs.length}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="bcx-section-tab bcx-more-tabs" aria-label="More sections" title="More sections">
        <Ellipsis size={16} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal to={bar?.closest('.bcx-side-panel-shell') ?? undefined}>
        <DropdownMenu.Content class="bcx-section-overflow" align="end" sideOffset={6} strategy="fixed" onCloseAutoFocus={handleCloseAutoFocus}>
          {#each hiddenTabs as tab (tab.id)}
            {#if tab.sortOptions}
              {#each tab.sortOptions as option (option.id)}
                <DropdownMenu.Item class="bcx-section-menu-item" title={option.title} onSelect={() => onSelectSortOption(tab, option.id)}>
                  {tab.label} · {option.label}
                </DropdownMenu.Item>
              {/each}
            {:else}
              <DropdownMenu.Item class="bcx-section-menu-item" title={tabTitle(tab)} onSelect={() => onSelectSortOption(tab, tab.id)}>
                {@render tabLabel(tab)}
              </DropdownMenu.Item>
            {/if}
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  {/if}
  {#if actions}
    <div bind:this={actionsElement} class="bcx-section-actions">{@render actions()}</div>
  {/if}
  <div class="bcx-tab-measurements" aria-hidden="true" inert>
    <div bind:this={measurements} class="bcx-tab-measurement-list">
      {#each tabs as tab (tab.id)}
        {#if tab.sortOptions}
          <span class="bcx-sort-tab-group">
            <span class="bcx-section-tab">{tab.label} · {selectedSortOption(tab)?.label ?? tab.sortOptions[0].label}</span>
            <span class="bcx-section-tab bcx-sort-button"><ChevronDown size={14} /></span>
          </span>
        {:else}
          <span class="bcx-section-tab">{@render tabLabel(tab)}</span>
        {/if}
      {/each}
    </div>
    <span bind:this={moreMeasurement} class="bcx-section-tab bcx-more-tabs"><Ellipsis size={16} /></span>
  </div>
</div>

<style>
  .bcx-section-actions { margin-left: auto; flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
  .wrap-actions { container-type: inline-size; flex-wrap: wrap; }
  .wrap-actions .bcx-section-actions { max-width: 100%; flex-wrap: wrap; justify-content: flex-end; }
  .actions-only .bcx-section-actions { margin-left: 0; justify-content: flex-start; }
  @container (max-width: 620px) {
    .wrap-actions .bcx-section-actions { flex-basis: 100%; }
  }
  .bcx-section-tabs {
    flex-shrink: 0;
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    margin: 0 8px 8px;
    padding: 4px;
    border: 1px solid #4b5563;
    border-radius: 8px;
    background: rgb(17 24 39 / 60%);
    box-shadow: 0 1px 2px rgb(0 0 0 / 15%);
  }
  :global(.bcx-visible-tabs) {
    display: flex;
    gap: 4px;
    min-width: 0;
    overflow: hidden;
  }
  :global(.bcx-section-tab) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 200px;
    overflow: hidden;
    white-space: nowrap;
    border-radius: 6px;
    min-height: 28px;
    padding: 4px 8px;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    color: #d1d5db;
    cursor: pointer;
  }
  .bcx-tab-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :global(.bcx-section-tab:hover),
  :global(.bcx-section-tab[data-state='active']),
  :global(.bcx-section-menu-item[data-highlighted]) {
    background: #374151;
    color: #f9fafb;
  }
  :global(.bcx-section-tab[data-state='active']) {
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 10%);
  }
  :global(.bcx-section-tab:focus-visible) {
    outline: 2px solid #04b1fe;
    outline-offset: -2px;
  }
  :global(.bcx-more-tabs) {
    flex: 0 0 32px;
    justify-content: center;
  }
  .bcx-sort-tab-group {
    display: inline-flex;
    min-width: 0;
    max-width: 100%;
    flex: 0 1 auto;
    gap: 2px;
  }
  :global(.bcx-sort-button) {
    flex: 0 0 24px;
    justify-content: center;
    padding-inline: 4px;
  }
  .bcx-sort-check {
    display: inline-flex;
    width: 14px;
    flex: 0 0 14px;
  }
  :global(.bcx-section-overflow) {
    z-index: 1000000;
    pointer-events: auto;
    max-width: min(320px, calc(100vw - 24px));
    max-height: min(400px, var(--bits-dropdown-menu-content-available-height));
    overflow-y: auto;
    padding: 4px;
    border: 1px solid #4b5563;
    border-radius: 8px;
    background: #111827;
    color: #f9fafb;
    box-shadow: 0 4px 12px rgb(0 0 0 / 25%);
  }
  :global(.bcx-section-menu-item) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
  }
  :global(.bcx-section-menu-item) .bcx-tab-label {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .bcx-tab-measurements {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
  }
  .bcx-tab-measurement-list {
    display: flex;
    width: max-content;
  }
</style>
