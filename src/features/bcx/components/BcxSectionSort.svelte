<script lang="ts">
import {
  ArrowDown01,
  ArrowDown10,
  ArrowDownAZ,
  ArrowDownNarrowWide,
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowDownZA,
  CalendarArrowDown,
  CalendarArrowUp,
  Check,
  ChevronDown,
} from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import type { SectionNavigationItem } from './sectionNavigation';

const sortIcons: Partial<Record<string, typeof ArrowDownUp>> = {
  az: ArrowDownAZ,
  za: ArrowDownZA,
  newest: CalendarArrowDown,
  oldest: CalendarArrowUp,
  'most-releases': ArrowDownWideNarrow,
  'fewest-releases': ArrowDownNarrowWide,
  'low-to-high': ArrowDown01,
  'high-to-low': ArrowDown10,
};

let {
  item,
  iconOnly = false,
  onValueChange,
  onCloseAutoFocus,
}: {
  item: SectionNavigationItem;
  iconOnly?: boolean;
  onValueChange: (id: string) => void;
  onCloseAutoFocus: (event: Event) => void;
} = $props();
let trigger = $state<HTMLButtonElement | null>(null);
const selectedOption = $derived(
  item.sortOptions?.find((option) => option.id === item.sortValue),
);
const label = $derived(item.sortLabel ?? 'Sort items');
const buttonLabel = $derived(
  selectedOption ? `${label} — ${selectedOption.label}` : label,
);
const SelectedIcon = $derived(
  (iconOnly && selectedOption && sortIcons[selectedOption.id]) || ArrowDownUp,
);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger bind:ref={trigger} class={`bcx-section-tab bcx-section-sort${iconOnly ? ' bcx-section-sort-icon-only' : ''}`} data-bcx-section-sort aria-label={iconOnly ? buttonLabel : `${label}: ${selectedOption?.label ?? ''}`} title={iconOnly ? buttonLabel : selectedOption?.title ?? label}>
    <SelectedIcon size={14} aria-hidden="true" />
    {#if !iconOnly}
      <span class="bcx-section-sort-label">{selectedOption?.label ?? 'Sort'}</span>
      <ChevronDown size={14} aria-hidden="true" />
    {/if}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal to={trigger?.closest('.bcx-side-panel-shell') ?? undefined}>
    <DropdownMenu.Content class="bcx-section-overflow" align="end" sideOffset={6} collisionPadding={8} strategy="fixed" {onCloseAutoFocus}>
      <DropdownMenu.RadioGroup value={item.sortValue} {onValueChange} aria-label={label}>
        {#each item.sortOptions ?? [] as option (option.id)}
          {@const OptionIcon = iconOnly ? sortIcons[option.id] : undefined}
          <DropdownMenu.RadioItem value={option.id} class="bcx-section-menu-item" title={option.title}>
            <span class="bcx-section-sort-check">{#if option.id === item.sortValue}<Check size={14} aria-hidden="true" />{/if}</span>
            {#if OptionIcon}<OptionIcon size={14} class="shrink-0" aria-hidden="true" />{/if}
            {option.label}
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
:global(.bcx-section-tab.bcx-section-sort) { box-sizing: border-box; flex: 0 1 auto; justify-content: space-between; max-width: 100%; min-height: 36px; padding: 6px 8px; border: 1px solid #4b5563; background: #374151; }
:global(.bcx-section-tab.bcx-section-sort-icon-only) { flex: none; justify-content: center; width: 2rem; padding-inline: 0; }
:global(.bcx-section-sort > svg) { flex-shrink: 0; }
.bcx-section-sort-label { white-space: normal; overflow-wrap: anywhere; }
.bcx-section-sort-check { display: inline-flex; flex: 0 0 14px; width: 14px; }
</style>
