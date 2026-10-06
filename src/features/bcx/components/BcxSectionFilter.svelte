<script lang="ts">
import { Check, ChevronDown, ListFilter } from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import {
  isSectionItemSelected,
  type SectionNavigationItem,
} from './sectionNavigation';

let {
  items,
  label,
  value,
  onValueChange,
  onCloseAutoFocus,
}: {
  items: SectionNavigationItem[];
  label: string;
  value: string;
  onValueChange: (id: string) => void;
  onCloseAutoFocus: (event: Event) => void;
} = $props();
let trigger = $state<HTMLButtonElement | null>(null);
const selectedItem = $derived(
  items.find((item) => isSectionItemSelected(item, value)),
);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger bind:ref={trigger} class="bcx-section-tab bcx-section-filter" data-bcx-section-filter aria-label={`${label}: ${selectedItem?.label ?? ''}`} title={selectedItem?.title ?? 'Choose which view to show'}>
    <ListFilter size={14} aria-hidden="true" />
    <span class="bcx-section-filter-label">{selectedItem?.label ?? 'Select view'}</span>
    <ChevronDown size={14} aria-hidden="true" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal to={trigger?.closest('.bcx-side-panel-shell') ?? undefined}>
    <DropdownMenu.Content class="bcx-section-overflow" align="end" sideOffset={6} collisionPadding={8} strategy="fixed" {onCloseAutoFocus}>
      <DropdownMenu.RadioGroup value={selectedItem?.id} {onValueChange} aria-label={label}>
        {#each items as item (item.id)}
          <DropdownMenu.RadioItem value={item.id} class="bcx-section-menu-item" title={item.title}>
            <span class="bcx-section-filter-check">{#if item.id === selectedItem?.id}<Check size={14} aria-hidden="true" />{/if}</span>
            {item.label}
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
:global(.bcx-section-tab.bcx-section-filter) { box-sizing: border-box; flex: 0 1 auto; justify-content: space-between; max-width: 100%; min-height: 36px; padding: 6px 8px; border: 1px solid #4b5563; background: #374151; }
:global(.bcx-section-filter > svg) { flex-shrink: 0; }
.bcx-section-filter-label { white-space: normal; overflow-wrap: anywhere; }
.bcx-section-filter-check { display: inline-flex; flex: 0 0 14px; width: 14px; }
</style>
