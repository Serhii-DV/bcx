<script lang="ts">
import { Ellipsis } from '@lucide/svelte';
import { DropdownMenu, Tabs } from 'bits-ui';
import { makeIcon } from 'src/features/treeview/utils/icon';
import { tick } from 'svelte';
import { getVisibleSectionTabIds } from './sectionTabOverflow';

interface SectionTab {
  id: string;
  label: string;
  image?: string;
}

let {
  tabs,
  value = $bindable(),
  label = 'Music Explorer sections',
}: {
  tabs: SectionTab[];
  value: string;
  label?: string;
} = $props();
let bar = $state<HTMLDivElement>();
let measurements: HTMLDivElement;
let moreMeasurement: HTMLSpanElement;
let visibleIds = $state<string[]>([]);
let focusSelectedOnClose = false;
const visibleTabs = $derived(tabs.filter((tab) => visibleIds.includes(tab.id)));
const hiddenTabs = $derived(tabs.filter((tab) => !visibleIds.includes(tab.id)));

// Measure all labels independently of which tabs are currently visible.
$effect(() => {
  const barElement = bar;
  if (!barElement) return;
  const currentTabs = tabs;
  const activeId = value;
  const measure = () => {
    const widths = Array.from(
      measurements.children,
      (element) => element.getBoundingClientRect().width,
    );
    visibleIds = getVisibleSectionTabIds(
      currentTabs.map((tab, index) => ({ ...tab, width: widths[index] ?? 0 })),
      activeId,
      barElement.clientWidth - 8,
      moreMeasurement.getBoundingClientRect().width,
    );
  };
  const observer = new ResizeObserver(measure);
  observer.observe(barElement);
  observer.observe(measurements);
  measure();
  return () => observer.disconnect();
});

function onSelectTab(id: string) {
  focusSelectedOnClose = true;
  value = id;
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
  <span class="bcx-tab-label">{tab.label}</span>
{/snippet}

<div bind:this={bar} class="bcx-section-tabs">
  <Tabs.List class="bcx-visible-tabs" aria-label={label}>
    {#each visibleTabs as tab (tab.id)}
      <Tabs.Trigger value={tab.id} class="bcx-section-tab" title={tab.label}>
        {@render tabLabel(tab)}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>
  {#if hiddenTabs.length}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="bcx-section-tab bcx-more-tabs" aria-label="More sections" title="More sections">
        <Ellipsis size={16} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal to={bar?.closest('.bcx-side-panel-shell') ?? undefined}>
        <DropdownMenu.Content class="bcx-section-overflow" align="end" sideOffset={6} strategy="fixed" onCloseAutoFocus={handleCloseAutoFocus}>
          {#each hiddenTabs as tab (tab.id)}
            <DropdownMenu.Item class="bcx-section-menu-item" onSelect={() => onSelectTab(tab.id)}>
              {@render tabLabel(tab)}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  {/if}
  <div class="bcx-tab-measurements" aria-hidden="true" inert>
    <div bind:this={measurements} class="bcx-tab-measurement-list">
      {#each tabs as tab (tab.id)}
        <span class="bcx-section-tab">{@render tabLabel(tab)}</span>
      {/each}
    </div>
    <span bind:this={moreMeasurement} class="bcx-section-tab bcx-more-tabs"><Ellipsis size={16} /></span>
  </div>
</div>

<style>
  .bcx-section-tabs {
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
