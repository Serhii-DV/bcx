<script lang="ts">
import { Check, ChevronDown, ListFilter } from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { makeIcon } from 'src/features/treeview/utils/icon';
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
  onCloseAutoFocus?: (event: Event) => void;
} = $props();
let trigger = $state<HTMLButtonElement | null>(null);
const selectedItem = $derived(
  items.find((item) => isSectionItemSelected(item, value)),
);
</script>

{#snippet viewIcon(image: string | undefined)}
  {@const Icon = makeIcon(image?.includes('/') ? undefined : image)}
  {#if Icon}
    <Icon size={16} class="shrink-0" aria-hidden="true" />
  {:else if image}
    <img src={image} alt="" class="size-4 shrink-0 rounded-sm object-cover" />
  {:else}
    <ListFilter size={16} class="shrink-0" aria-hidden="true" />
  {/if}
{/snippet}

<DropdownMenu.Root>
  <DropdownMenu.Trigger bind:ref={trigger} class="bcx-section-tab bcx-section-filter" data-bcx-section-filter aria-label={`${label}: ${selectedItem?.label ?? ''}`} title={selectedItem?.title ?? 'Choose which view to show'}>
    {@render viewIcon(selectedItem?.image)}
    <span class="bcx-section-filter-label">{selectedItem?.label ?? 'Select view'}</span>
    <ChevronDown size={14} class="shrink-0" aria-hidden="true" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal to={trigger?.closest('.bcx-side-panel-shell') ?? undefined}>
    <DropdownMenu.Content class="bcx-section-overflow" align="end" sideOffset={6} collisionPadding={8} strategy="fixed" {onCloseAutoFocus}>
      <DropdownMenu.RadioGroup value={selectedItem?.id} {onValueChange} aria-label={label}>
        {#each items as item (item.id)}
          <DropdownMenu.RadioItem value={item.id} class="bcx-section-menu-item" title={item.title}>
            <span class="bcx-section-filter-check">{#if item.id === selectedItem?.id}<Check size={14} aria-hidden="true" />{/if}</span>
            {@render viewIcon(item.image)}
            <span class="bcx-section-filter-label">{item.label}</span>
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
:global(.bcx-section-tab.bcx-section-filter) { box-sizing: border-box; flex: 0 1 auto; justify-content: space-between; max-width: 100%; min-height: 36px; padding: 6px 8px; border: 1px solid #4b5563; background: #374151; }
.bcx-section-filter-label { white-space: normal; overflow-wrap: anywhere; }
.bcx-section-filter-check { display: inline-flex; flex: 0 0 14px; width: 14px; }
</style>
