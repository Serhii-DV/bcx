<script lang="ts">
import { Check, ChevronDown, Ellipsis, X } from '@lucide/svelte';
import { DropdownMenu, Tabs, Tooltip } from 'bits-ui';
import { makeIcon } from 'src/features/treeview/utils/icon';
import { type Snippet, tick } from 'svelte';
import { getVisibleSectionTabIds } from './sectionTabOverflow';

interface SectionTab {
  id: string;
  label: string;
  count?: number;
  image?: string;
  title?: string;
  contentId?: string;
  keepLabelWhenCompact?: boolean;
  compactLabel?: string;
  sortOptions?: { id: string; label: string; title?: string }[];
  sortValue?: string;
  sortLabel?: string;
  onSortChange?: (id: string) => void;
  onClose?: () => void;
}

let {
  tabs,
  value = $bindable(),
  label = 'Music Explorer sections',
  actions,
  leadingActions,
  onValueChange,
  wrapActions = false,
  vertical = false,
  compactWhenOverflowing = false,
  hideCountsWhenOverflowing = false,
}: {
  tabs: SectionTab[];
  value: string;
  label?: string;
  actions?: Snippet;
  leadingActions?: Snippet;
  onValueChange?: (id: string) => void;
  wrapActions?: boolean;
  vertical?: boolean;
  compactWhenOverflowing?: boolean;
  hideCountsWhenOverflowing?: boolean;
} = $props();
let bar = $state<HTMLDivElement>();
let actionsElement = $state<HTMLDivElement>();
let leadingActionsElement = $state<HTMLDivElement>();
let measurements: HTMLDivElement;
let iconMeasurements = $state<HTMLDivElement>();
let iconCountMeasurements = $state<HTMLDivElement>();
let moreMeasurement: HTMLSpanElement;
let visibleIds = $state<string[]>([]);
let compact = $state(false);
let iconOnly = $state(false);
let hideCounts = $state(false);
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
  if (vertical) {
    compact = false;
    iconOnly = false;
    hideCounts = false;
    visibleIds = currentTabs.map((tab) => tab.id);
    return;
  }
  const currentActions = actionsElement;
  const currentLeadingActions = leadingActionsElement;
  const useActionButtons = !!onValueChange;
  const currentIconMeasurements = iconMeasurements;
  const currentIconCountMeasurements = iconCountMeasurements;
  const canHideCounts = hideCountsWhenOverflowing;
  const canCompact =
    compactWhenOverflowing &&
    currentTabs.every((tab) => tab.image && !tab.sortOptions && !tab.onClose);
  const activeId =
    currentTabs.find((tab) =>
      tab.sortOptions?.some((option) => option.id === value),
    )?.id ?? value;
  const measure = () => {
    const widths = Array.from(
      measurements.children,
      (element) => element.getBoundingClientRect().width,
    );
    const availableWidth =
      barElement.clientWidth -
      8 -
      (currentLeadingActions
        ? currentLeadingActions.getBoundingClientRect().width + 4
        : 0) -
      (currentActions && getComputedStyle(currentActions).flexBasis !== '100%'
        ? currentActions.getBoundingClientRect().width + 4
        : 0);
    const labelledIds = getVisibleSectionTabIds(
      currentTabs.map((tab, index) => ({ ...tab, width: widths[index] ?? 0 })),
      activeId,
      availableWidth,
      moreMeasurement.getBoundingClientRect().width,
    );
    const shouldCompact =
      canCompact &&
      !!currentIconMeasurements &&
      labelledIds.length < currentTabs.length;
    compact = shouldCompact;
    iconOnly = false;
    hideCounts = false;
    if (shouldCompact && useActionButtons && currentIconMeasurements) {
      const compactWidth =
        Array.from(currentIconMeasurements.children).reduce(
          (total, element) => total + element.getBoundingClientRect().width,
          0,
        ) +
        4 * (currentTabs.length - 1);
      const shouldUseIconsOnly = compactWidth > availableWidth;
      iconOnly = shouldUseIconsOnly;
      if (shouldUseIconsOnly && canHideCounts && currentIconCountMeasurements) {
        const iconCountWidth =
          Array.from(currentIconCountMeasurements.children).reduce(
            (total, element) => total + element.getBoundingClientRect().width,
            0,
          ) +
          4 * (currentTabs.length - 1);
        hideCounts = iconCountWidth > availableWidth;
      }
      visibleIds = currentTabs.map((tab) => tab.id);
      return;
    }
    if (!shouldCompact || !currentIconMeasurements) {
      visibleIds = labelledIds;
      return;
    }
    const iconWidths = Array.from(
      currentIconMeasurements.children,
      (element) => element.getBoundingClientRect().width,
    );
    visibleIds = getVisibleSectionTabIds(
      currentTabs.map((tab, index) => ({
        ...tab,
        width: iconWidths[index] ?? 0,
      })),
      activeId,
      availableWidth,
      moreMeasurement.getBoundingClientRect().width,
    );
  };
  const observer = new ResizeObserver(measure);
  observer.observe(barElement);
  observer.observe(measurements);
  if (currentIconMeasurements) observer.observe(currentIconMeasurements);
  if (currentIconCountMeasurements)
    observer.observe(currentIconCountMeasurements);
  if (currentActions) observer.observe(currentActions);
  if (currentLeadingActions) observer.observe(currentLeadingActions);
  measure();
  return () => observer.disconnect();
});

function onSelectSortOption(tab: SectionTab, id: string) {
  focusSelectedOnClose = true;
  tab.onSortChange?.(id);
  value = tab.onSortChange ? tab.id : id;
  onValueChange?.(value);
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

function tabAccessibleLabel(tab: SectionTab) {
  const label = tabLabelText(tab);
  return tab.count === undefined ? label : `${label} (${tab.count})`;
}

async function handleCloseAutoFocus(event: Event) {
  if (!focusSelectedOnClose) return;
  event.preventDefault();
  focusSelectedOnClose = false;
  await tick();
  bar
    ?.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"], button[aria-pressed="true"]',
    )
    ?.focus();
}
</script>

{#snippet countBadge(count: number | undefined)}
  {#if count !== undefined}<span class="bcx-section-count">{count}</span>{/if}
{/snippet}

{#snippet tabLabel(tab: SectionTab, useCompactLabel = false)}
  {@const Icon = makeIcon(tab.image?.includes('/') ? undefined : tab.image)}
  {#if Icon}
    <Icon size={16} class="shrink-0" aria-hidden="true" />
  {:else if tab.image}
    <img src={tab.image} alt="" class="bcx-tab-image shrink-0 rounded-sm object-cover" />
  {/if}
  <span class="bcx-tab-label" class:keep-label={tab.keepLabelWhenCompact}>{useCompactLabel ? (tab.compactLabel ?? tabLabelText(tab)) : tabLabelText(tab)}</span>
  {@render countBadge(tab.count)}
{/snippet}

{#snippet navigationButtons()}
    {#each visibleTabs as tab (tab.id)}
      {#if tab.sortOptions}
        <div class="bcx-sort-tab-group">
          <Tabs.Trigger value={tab.onSortChange ? tab.id : selectedSortOption(tab)?.id ?? tab.id} class="bcx-section-tab" aria-label={tabAccessibleLabel(tab)} title={tabTitle(tab)}>
            {@render tabLabel(tab, compact)}
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
      {:else if tab.onClose}
        <div class="bcx-closable-tab-group" class:active={value === tab.id} role="group" aria-label={tab.label}>
          <Tabs.Trigger value={tab.id} class="bcx-section-tab" aria-label={tabAccessibleLabel(tab)} title={tabTitle(tab)}>
            {@render tabLabel(tab, compact)}
          </Tabs.Trigger>
          <button type="button" class="bcx-section-tab bcx-tab-close" aria-label={`Close ${tab.label}`} title={`Close ${tab.label}`} tabindex={value === tab.id ? 0 : -1} onclick={() => tab.onClose?.()}><X size={14} aria-hidden="true" /></button>
        </div>
      {:else if compactWhenOverflowing || onValueChange}
        <Tooltip.Root disabled={!compact} ignoreNonKeyboardFocus>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              {#if onValueChange}
                <button {...props} type="button" class="bcx-section-tab" aria-label={tabAccessibleLabel(tab)} aria-pressed={value === tab.id} aria-controls={tab.contentId} data-state={value === tab.id ? 'active' : 'inactive'} title={compact ? undefined : tabTitle(tab)} onclick={(event) => { if (typeof props.onclick === 'function') props.onclick(event); onValueChange?.(tab.id); }}>
                  {@render tabLabel(tab, compact)}
                </button>
              {:else}
              <Tabs.Trigger {...props} value={tab.id} class="bcx-section-tab" aria-label={tabAccessibleLabel(tab)} title={compact ? undefined : tabTitle(tab)}>
                {@render tabLabel(tab, compact)}
              </Tabs.Trigger>
              {/if}
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Portal to={bar?.closest('.bcx-side-panel-shell') ?? undefined}>
            <Tooltip.Content class="sidebar-tooltip" side="bottom" align="start" sideOffset={8} collisionPadding={8} strategy="fixed">
              <div class="bcx-tooltip-heading"><strong>{tabLabelText(tab)}</strong>{@render countBadge(tab.count)}</div>
              {#if tab.title}<p>{tab.title}</p>{/if}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      {:else}
        <Tabs.Trigger value={tab.id} class="bcx-section-tab" aria-label={tabAccessibleLabel(tab)} title={tabTitle(tab)}>
          {@render tabLabel(tab, compact)}
        </Tabs.Trigger>
      {/if}
    {/each}
{/snippet}

<div bind:this={bar} class="bcx-section-tabs" class:vertical class:compact class:icon-only={iconOnly} class:hide-counts={hideCounts} class:action-navigation={!!onValueChange} class:wrap-actions={wrapActions} class:actions-only={!tabs.length} role={tabs.length ? undefined : 'group'} aria-label={tabs.length ? undefined : label}>
  {#if leadingActions}
    <div bind:this={leadingActionsElement} class="bcx-section-leading-actions">{@render leadingActions()}</div>
  {/if}
  {#if tabs.length}
    {#if onValueChange}
      <div class="bcx-visible-tabs" role="group" aria-label={label}>{@render navigationButtons()}</div>
    {:else}
      <Tabs.List class="bcx-visible-tabs" aria-label={label}>{@render navigationButtons()}</Tabs.List>
    {/if}
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
                  <span>{tab.label} · {option.label}</span>{@render countBadge(tab.count)}
                </DropdownMenu.Item>
              {/each}
            {:else if tab.onClose}
              <div class="bcx-overflow-tab-group">
                <DropdownMenu.Item class="bcx-section-menu-item" title={tabTitle(tab)} onSelect={() => onSelectSortOption(tab, tab.id)}>
                  {@render tabLabel(tab, compact)}
                </DropdownMenu.Item>
                <DropdownMenu.Item class="bcx-section-menu-item bcx-close-menu-item" aria-label={`Close ${tab.label}`} title={`Close ${tab.label}`} onSelect={() => { focusSelectedOnClose = true; tab.onClose?.(); }}><X size={14} aria-hidden="true" /></DropdownMenu.Item>
              </div>
            {:else}
              <DropdownMenu.Item class="bcx-section-menu-item" title={tabTitle(tab)} onSelect={() => onSelectSortOption(tab, tab.id)}>
                {@render tabLabel(tab, compact)}
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
            <span class="bcx-section-tab">{@render tabLabel(tab)}</span>
            <span class="bcx-section-tab bcx-sort-button"><ChevronDown size={14} /></span>
          </span>
        {:else if tab.onClose}
          <span class="bcx-closable-tab-group" class:active={value === tab.id}>
            <span class="bcx-section-tab">{@render tabLabel(tab)}</span>
            <span class="bcx-section-tab bcx-tab-close"><X size={14} /></span>
          </span>
        {:else}
          <span class="bcx-section-tab">{@render tabLabel(tab)}</span>
        {/if}
      {/each}
    </div>
    {#if compactWhenOverflowing}
      <div bind:this={iconMeasurements} class="bcx-tab-measurement-list bcx-tab-icon-measurements">
        {#each tabs as tab (tab.id)}
          <span class="bcx-section-tab">{@render tabLabel(tab, true)}</span>
        {/each}
      </div>
      {#if hideCountsWhenOverflowing}
        <div bind:this={iconCountMeasurements} class="bcx-tab-measurement-list bcx-tab-icon-measurements bcx-tab-icon-count-measurements">
          {#each tabs as tab (tab.id)}
            <span class="bcx-section-tab">{@render tabLabel(tab, true)}</span>
          {/each}
        </div>
      {/if}
    {/if}
    <span bind:this={moreMeasurement} class="bcx-section-tab bcx-more-tabs"><Ellipsis size={16} /></span>
  </div>
</div>

<style>
  .bcx-section-leading-actions { display: flex; flex-shrink: 0; align-items: center; gap: 8px; max-width: 100%; }
  .action-navigation { flex-wrap: wrap; }
  .action-navigation :global(.bcx-visible-tabs) { flex: 1 1 0%; min-width: min-content; flex-wrap: wrap; overflow: visible; }
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
    margin: 0 var(--bcx-preview-gutter, 8px) 8px;
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
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: #d1d5db;
    cursor: pointer;
  }
  .bcx-tab-image { width: 16px; height: 16px; }
  .bcx-tab-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bcx-section-count { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; box-sizing: border-box; min-width: 20px; padding: 0 6px; color: #e5e7eb; font-size: 11px; font-weight: 600; line-height: 18px; font-variant-numeric: tabular-nums; }
  .bcx-tooltip-heading { display: flex; align-items: flex-start; gap: 8px; }
  .bcx-tooltip-heading strong { flex: 1; min-width: 0; }
  .hide-counts :global(.bcx-visible-tabs .bcx-section-count) { display: none; }
  .bcx-tab-icon-count-measurements .bcx-tab-label,
  .icon-only :global(.bcx-visible-tabs .bcx-tab-label),
  .compact :global(.bcx-visible-tabs .bcx-tab-label:not(.keep-label)),
  .bcx-tab-icon-measurements .bcx-tab-label:not(.keep-label) { display: none; }
  .compact :global(.bcx-visible-tabs > .bcx-section-tab),
  .bcx-tab-icon-measurements :global(.bcx-section-tab) {
    box-sizing: border-box;
    flex: 0 0 auto;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
    padding: 8px;
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
  .bcx-closable-tab-group {
    display: inline-flex;
    min-width: 0;
    max-width: 224px;
    flex: 0 1 auto;
    border: 1px solid #4b5563;
    border-radius: 6px;
    background: rgb(17 24 39 / 60%);
  }
  .bcx-closable-tab-group.active { border-color: #6b7280; background: #374151; }
  .bcx-closable-tab-group :global(.bcx-section-tab:not(.bcx-tab-close)) { flex: 1 1 auto; border-radius: 5px 0 0 5px; }
  .bcx-closable-tab-group :global(.bcx-tab-close) { border-left: 1px solid #4b5563; border-radius: 0 5px 5px 0; }
  .bcx-closable-tab-group.active :global(.bcx-section-tab) { color: #f9fafb; }
  .bcx-closable-tab-group :global(.bcx-section-tab[data-state='active']) { box-shadow: none; }
  :global(.bcx-tab-close) { flex: 0 0 24px; justify-content: center; padding-inline: 4px; }
  .bcx-overflow-tab-group { display: flex; align-items: center; }
  .bcx-overflow-tab-group :global(.bcx-section-menu-item:not(.bcx-close-menu-item)) { flex: 1 1 0%; min-width: 0; }
  :global(.bcx-close-menu-item) { flex-shrink: 0; }
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
  .bcx-section-tabs.vertical {
    flex: 0 0 var(--bcx-preview-column-width, 11rem);
    margin-right: var(--bcx-preview-column-gap, 8px);
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    min-height: 0;
    overflow-y: auto;
  }
  .vertical :global(.bcx-visible-tabs) { flex: 0 0 auto; flex-direction: column; flex-wrap: nowrap; min-width: 0; overflow: visible; }
  .vertical :global(.bcx-visible-tabs > .bcx-section-tab) { max-width: none; justify-content: flex-start; }
</style>
