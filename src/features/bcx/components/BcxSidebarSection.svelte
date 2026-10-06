<script lang="ts">
import { Check, ChevronDown, ChevronRight } from '@lucide/svelte';
import { Collapsible, DropdownMenu } from 'bits-ui';
import type { Snippet } from 'svelte';
import * as Sidebar from '$lib/components/ui/sidebar/index.js';
import {
  isSectionItemSelected,
  type SectionNavigation,
  type SectionNavigationItem,
} from './sectionNavigation';

let {
  section,
  subsections,
  active,
  icon,
  portal,
  menuOpen,
  tooltipDisabled,
  onActivate,
  onSelected,
  onMenuOpenChange,
}: {
  section: {
    id: string;
    label: string;
    title?: string;
    loaded?: boolean;
    loading?: boolean;
    error?: string;
  };
  subsections?: SectionNavigation;
  active: boolean;
  icon: Snippet;
  portal?: Element;
  menuOpen: boolean;
  tooltipDisabled: boolean;
  onActivate: () => void;
  onSelected: () => void;
  onMenuOpenChange: (open: boolean) => void;
} = $props();

const sidebar = Sidebar.useSidebar();
let expanded = $state(false);
let selectedFromMenu = false;

$effect(() => {
  if (active && sidebar.open) expanded = true;
});

function select(
  item: SectionNavigationItem,
  sortId?: string,
  fromMenu = false,
) {
  if (!subsections) return;
  if (sortId) item.onSortChange?.(sortId);
  subsections.select(
    item.onSortChange ? item.id : (sortId ?? item.sortValue ?? item.id),
  );
  selectedFromMenu = fromMenu;
  onSelected();
}

function handleCloseAutoFocus(event: Event) {
  if (!selectedFromMenu) return;
  event.preventDefault();
  selectedFromMenu = false;
}
</script>

{#snippet unavailable()}
  <p class="bcx-sidebar-status" role="status">{section.error ?? (section.loading || !section.loaded ? 'Loading sections…' : 'No sections available.')}</p>
{/snippet}

{#snippet sortOptions(item: SectionNavigationItem)}
  <DropdownMenu.RadioGroup value={item.sortValue} onValueChange={(id) => select(item, id, true)} aria-label={item.sortLabel ?? `Sort ${item.label}`}>
    {#each item.sortOptions ?? [] as option (option.id)}
      <DropdownMenu.RadioItem value={option.id} class="bcx-navigation-menu-item" title={option.title}>
        <span class="bcx-navigation-check">{#if option.id === item.sortValue}<Check size={14} aria-hidden="true" />{/if}</span>
        {option.label}
      </DropdownMenu.RadioItem>
    {/each}
  </DropdownMenu.RadioGroup>
{/snippet}

<Sidebar.MenuItem>
  {#if sidebar.open}
    <Collapsible.Root bind:open={expanded}>
      <Sidebar.MenuButton isActive={active} aria-label={section.label} aria-current={active && !expanded ? 'page' : undefined}>
        {#snippet child({ props })}
          <Collapsible.Trigger {...props} onclick={onActivate}>
            {@render icon()}
            <span class="bcx-sidebar-label">{section.label}</span>
            <ChevronDown size={14} class={expanded ? 'rotate-180' : ''} aria-hidden="true" />
          </Collapsible.Trigger>
        {/snippet}
      </Sidebar.MenuButton>
      <Collapsible.Content>
        <Sidebar.Menu class="bcx-navigation-tools" aria-label={`${section.label} sections`}>
          {#each subsections?.items ?? [] as item (item.id)}
            {@const selected = active && !!subsections && isSectionItemSelected(item, subsections.value)}
            <Sidebar.MenuItem>
              <div class="bcx-sidebar-subsection-row">
                <Sidebar.MenuButton isActive={selected} aria-current={selected ? 'page' : undefined} aria-label={item.label} aria-controls={item.contentId} title={item.title} onclick={() => select(item)}>
                  <span class="bcx-sidebar-label">{item.label}</span>
                </Sidebar.MenuButton>
                {#if item.sortOptions?.length}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger class="bcx-sidebar-sort" aria-label={item.sortLabel ?? `Sort ${item.label}`} title={item.sortLabel}>
                      <ChevronDown size={14} aria-hidden="true" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal to={portal}>
                      <DropdownMenu.Content class="bcx-navigation-menu" data-bcx-sidebar-menu align="start" sideOffset={6} collisionPadding={8} strategy="fixed" onCloseAutoFocus={handleCloseAutoFocus}>
                        {@render sortOptions(item)}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                {/if}
              </div>
            </Sidebar.MenuItem>
          {:else}
            <Sidebar.MenuItem>{@render unavailable()}</Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Collapsible.Content>
    </Collapsible.Root>
  {:else}
    <DropdownMenu.Root open={menuOpen} onOpenChange={(open) => { onMenuOpenChange(open); if (open) { selectedFromMenu = false; onActivate(); } }}>
      <Sidebar.MenuButton isActive={active} aria-label={section.label} aria-current={active ? 'page' : undefined} tooltipDisabled={tooltipDisabled} tooltipPortal={portal}>
        {#snippet tooltipContent()}<strong>{section.label}</strong>{#if section.title}<p>{section.title}</p>{/if}{/snippet}
        {#snippet child({ props })}
          <DropdownMenu.Trigger {...props}>{@render icon()}</DropdownMenu.Trigger>
        {/snippet}
      </Sidebar.MenuButton>
      <DropdownMenu.Portal to={portal}>
        <DropdownMenu.Content class="bcx-navigation-menu" data-bcx-sidebar-menu side="right" align="start" sideOffset={8} collisionPadding={8} strategy="fixed" aria-label={`${section.label} sections`} onCloseAutoFocus={handleCloseAutoFocus}>
          <DropdownMenu.Group>
          <DropdownMenu.GroupHeading class="bcx-sidebar-menu-heading">{section.label}</DropdownMenu.GroupHeading>
          {#each subsections?.items ?? [] as item (item.id)}
            {@const selected = !!subsections && isSectionItemSelected(item, subsections.value)}
            {#if item.sortOptions?.length}
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger class="bcx-navigation-menu-item" title={item.title}>
                  <span class="bcx-sidebar-label">{item.label}</span>
                  {#if selected}<Check size={14} aria-hidden="true" />{/if}
                  <ChevronRight size={14} aria-hidden="true" />
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal to={portal}>
                  <DropdownMenu.SubContent class="bcx-navigation-menu" data-bcx-sidebar-menu sideOffset={6} collisionPadding={8} strategy="fixed" onCloseAutoFocus={handleCloseAutoFocus}>
                    {@render sortOptions(item)}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
            {:else}
              <DropdownMenu.Item class="bcx-navigation-menu-item" title={item.title} aria-current={selected ? 'page' : undefined} onSelect={() => select(item, undefined, true)}>
                <span class="bcx-sidebar-label">{item.label}</span>
                {#if selected}<Check size={14} aria-hidden="true" />{/if}
              </DropdownMenu.Item>
            {/if}
          {:else}
            {@render unavailable()}
          {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  {/if}
</Sidebar.MenuItem>

<style>
.bcx-sidebar-label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.bcx-sidebar-subsection-row { display: flex; align-items: stretch; min-width: 0; }
.bcx-sidebar-subsection-row :global(.sidebar-menu-button) { flex: 1; min-width: 0; }
:global(.bcx-sidebar-sort) { display: flex; flex: 0 0 24px; align-items: center; justify-content: center; border-radius: 6px; color: #d1d5db; cursor: pointer; }
:global(.bcx-sidebar-sort:hover), :global(.bcx-sidebar-sort[data-state='open']) { background: #374151; color: #f9fafb; }
:global(.bcx-sidebar-sort:focus-visible) { outline: 2px solid #04b1fe; outline-offset: -2px; }
.bcx-sidebar-status, :global(.bcx-sidebar-menu-heading) { margin: 0; padding: 8px; color: #9ca3af; font-size: 0.75rem; }
.bcx-navigation-check { display: inline-flex; width: 14px; flex: 0 0 14px; }
</style>
