<script lang="ts">
import {
  Check,
  ChevronDown,
  Disc,
  Folder,
  Menu,
  Settings2,
  UserRound,
} from '@lucide/svelte';
import { Collapsible, DropdownMenu } from 'bits-ui';
import { makeIcon } from 'src/features/treeview/utils/icon';
import { type Snippet, tick } from 'svelte';
import * as Sidebar from '$lib/components/ui/sidebar/index.js';
import type { PinnedPage } from '../pinnedNavigation';
import BcxPinnedNavigation from './BcxPinnedNavigation.svelte';
import BcxSidebarSection from './BcxSidebarSection.svelte';
import type { SectionNavigation } from './sectionNavigation';

interface NavigationSection {
  id: string;
  label: string;
  image?: string;
  title?: string;
  hasSubsections?: boolean;
  loaded?: boolean;
  loading?: boolean;
  error?: string;
}

let {
  sections,
  tools,
  value = $bindable(),
  contentId,
  syncStatus,
  subsections = {},
  headerActions,
  onPinSelect,
}: {
  sections: NavigationSection[];
  tools: NavigationSection[];
  value: string;
  contentId: string;
  syncStatus?: 'running' | 'error';
  subsections?: Record<string, SectionNavigation>;
  headerActions?: Snippet;
  onPinSelect?: (page: PinnedPage) => void;
} = $props();

const sidebar = Sidebar.useSidebar();
const navigationId = $props.id();
let navigation = $state<HTMLElement>();
let toolsMenuOpen = $state(false);
let sectionMenu = $state<string | null>(null);
let toolsExpanded = $state(false);
let focusSelectedOnClose = false;
const contextSections = $derived(sections.filter(isContext));
const followingSections = $derived(sections.filter(isFollowing));
const librarySections = $derived(
  sections.filter((section) => !isContext(section) && !isFollowing(section)),
);
const toolsSelected = $derived(tools.some((section) => section.id === value));
const toolsTitle = $derived(
  syncStatus === 'error'
    ? 'Tools — Sync needs attention.'
    : syncStatus === 'running'
      ? 'Tools — Sync in progress.'
      : 'Tools',
);
const toolsDescription = $derived(
  `Sync, storage, activity log, and extension information.${syncStatus === 'error' ? ' Sync needs attention.' : syncStatus === 'running' ? ' Sync is in progress.' : ''}`,
);

function isContext(section: NavigationSection) {
  return (
    section.id.startsWith('band-') ||
    section.id.startsWith('album-') ||
    section.id.startsWith('track-') ||
    section.id.startsWith('fan-')
  );
}

function isFollowing(section: NavigationSection) {
  return (
    section.label === 'Following Bands' || section.label === 'Following Genres'
  );
}

export function focusSelected() {
  const button =
    navigation?.querySelector<HTMLButtonElement>('[aria-current="page"]') ??
    navigation?.querySelector<HTMLButtonElement>('button');
  button?.focus();
}

async function selectSection(id: string) {
  value = id;
  if (sidebar.open && sidebar.overlay) {
    sidebar.setOpen(false);
    await tick();
    focusSelected();
  }
}

function selectFromMenu(id: string) {
  focusSelectedOnClose = true;
  void selectSection(id);
}

async function handleCloseAutoFocus(event: Event) {
  if (!focusSelectedOnClose) return;
  event.preventDefault();
  focusSelectedOnClose = false;
  await tick();
  focusSelected();
}

function handleOutsidePointer(event: PointerEvent) {
  if (
    sidebar.open &&
    sidebar.overlay &&
    navigation &&
    !event.composedPath().includes(navigation) &&
    !event
      .composedPath()
      .some(
        (target) =>
          target instanceof Element &&
          target.hasAttribute('data-bcx-sidebar-menu'),
      )
  ) {
    sidebar.setOpen(false);
  }
}

function handleEscape(event: KeyboardEvent) {
  if (
    event.key !== 'Escape' ||
    event.defaultPrevented ||
    !sidebar.open ||
    !sidebar.overlay
  )
    return;
  event.preventDefault();
  sidebar.setOpen(false);
  navigation
    ?.querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')
    ?.focus();
}

$effect(() => {
  if (sidebar.open) {
    toolsMenuOpen = false;
    sectionMenu = null;
  }
  if (sidebar.open && toolsSelected) toolsExpanded = true;
});

async function selectSubsection(id: string) {
  value = id;
  if (sidebar.open && sidebar.overlay) sidebar.setOpen(false);
  await tick();
  focusSelected();
}
</script>

<svelte:document onpointerdown={handleOutsidePointer} onkeydown={handleEscape} />

{#snippet sectionIcon(section: NavigationSection)}
  {@const Icon = makeIcon(section.image?.includes('/') ? undefined : section.image)}
  {#if Icon}
    <Icon size={16} aria-hidden="true" />
  {:else if section.image}
    <img src={section.image} alt="" class="bcx-navigation-image" />
  {:else if section.id.startsWith('band-')}
    <Disc size={16} aria-hidden="true" />
  {:else if section.id.startsWith('fan-')}
    <UserRound size={16} aria-hidden="true" />
  {:else}
    <Folder size={16} aria-hidden="true" />
  {/if}
{/snippet}

{#snippet sectionButton(section: NavigationSection)}
  {#if section.hasSubsections}
    <BcxSidebarSection
      {section}
      subsections={subsections[section.id]}
      active={value === section.id}
      portal={navigation?.closest('.bcx-side-panel-shell') ?? undefined}
      menuOpen={sectionMenu === section.id}
      tooltipDisabled={toolsMenuOpen || sectionMenu !== null}
      onActivate={() => { value = section.id; }}
      onSelected={() => void selectSubsection(section.id)}
      onMenuOpenChange={(open) => { sectionMenu = open ? section.id : sectionMenu === section.id ? null : sectionMenu; if (open) toolsMenuOpen = false; }}
    >
      {#snippet icon()}{@render sectionIcon(section)}{/snippet}
    </BcxSidebarSection>
  {:else}
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      isActive={value === section.id}
      aria-label={section.label}
      aria-current={value === section.id ? 'page' : undefined}
      aria-controls={`${contentId}-${section.id}`}
      tooltipDisabled={toolsMenuOpen || sectionMenu !== null}
      tooltipPortal={navigation?.closest('.bcx-side-panel-shell') ?? undefined}
      onclick={() => void selectSection(section.id)}
    >
      {#snippet tooltipContent()}
        <strong>{section.label}</strong>
        {#if section.title}<p>{section.title}</p>{/if}
      {/snippet}
      {@render sectionIcon(section)}
      <span data-sidebar-label class="bcx-navigation-label">{section.label}</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
  {/if}
{/snippet}

{#snippet toolsIcon()}
  <Settings2 size={16} aria-hidden="true" />
  {#if syncStatus}
    <span class="bcx-navigation-status" class:error={syncStatus === 'error'} aria-hidden="true"></span>
  {/if}
{/snippet}

<Sidebar.Root collapsible="icon">
  <nav bind:this={navigation} class="bcx-main-navigation" aria-label="Music Explorer sections">
    <Sidebar.Header class="bcx-navigation-top">
      <div class="bcx-navigation-controls">
        <Sidebar.MenuButton data-sidebar="trigger" aria-label={sidebar.open ? 'Collapse navigation' : 'Expand navigation'} aria-expanded={sidebar.open} aria-controls={navigationId} tooltipPortal={navigation?.closest('.bcx-side-panel-shell') ?? undefined} onclick={sidebar.toggle}>
          {#snippet tooltipContent()}<strong>Expand navigation</strong><p>Show navigation icons and labels.</p>{/snippet}
          <Menu size={16} aria-hidden="true" />
          <span data-sidebar-label>Navigation</span>
        </Sidebar.MenuButton>
        {#if sidebar.open && headerActions}{@render headerActions()}{/if}
      </div>
    </Sidebar.Header>
    <Sidebar.Content id={navigationId} class="bcx-navigation-scroll">
      <Sidebar.Menu>
        {#each contextSections as section (section.id)}{@render sectionButton(section)}{/each}
      </Sidebar.Menu>
      {#if contextSections.length && (librarySections.length || followingSections.length)}<Sidebar.Separator />{/if}
      <Sidebar.Menu>
        {#each librarySections as section (section.id)}{@render sectionButton(section)}{/each}
        {#each followingSections as section (section.id)}{@render sectionButton(section)}{/each}
      </Sidebar.Menu>
      <BcxPinnedNavigation {value} {contentId} portal={navigation?.closest('.bcx-side-panel-shell') ?? undefined} menuOpen={sectionMenu?.startsWith('__pin__') ? sectionMenu.slice('__pin__'.length) : undefined} tooltipDisabled={toolsMenuOpen || sectionMenu !== null} onMenuOpenChange={(id, open) => { const key = `__pin__${id}`; sectionMenu = open ? key : sectionMenu === key ? null : sectionMenu; if (open) toolsMenuOpen = false; }} onSelect={(page) => { onPinSelect?.(page); void selectSection(`__pin__${page.id}`); }} />
      <Sidebar.Separator />
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          {#if sidebar.open}
            <Collapsible.Root bind:open={toolsExpanded}>
              <Sidebar.MenuButton isActive={toolsSelected} aria-label={toolsTitle} aria-current={toolsSelected && !toolsExpanded ? 'page' : undefined}>
                {#snippet child({ props })}
                  <Collapsible.Trigger {...props}>
                    {@render toolsIcon()}
                    <span class="bcx-navigation-label">Tools</span>
                    <ChevronDown size={14} class={toolsExpanded ? 'rotate-180' : ''} aria-hidden="true" />
                  </Collapsible.Trigger>
                {/snippet}
              </Sidebar.MenuButton>
              <Collapsible.Content>
                <Sidebar.Menu class="bcx-navigation-tools">
                  {#each tools as section (section.id)}{@render sectionButton(section)}{/each}
                </Sidebar.Menu>
              </Collapsible.Content>
            </Collapsible.Root>
          {:else}
            <DropdownMenu.Root bind:open={toolsMenuOpen} onOpenChange={(open) => { if (open) sectionMenu = null; }}>
              <Sidebar.MenuButton isActive={toolsSelected} aria-label={toolsTitle} aria-current={toolsSelected ? 'page' : undefined} tooltipDisabled={toolsMenuOpen || sectionMenu !== null} tooltipPortal={navigation?.closest('.bcx-side-panel-shell') ?? undefined}>
                {#snippet tooltipContent()}<strong>Tools</strong><p>{toolsDescription}</p>{/snippet}
                {#snippet child({ props })}
                  <DropdownMenu.Trigger {...props}>{@render toolsIcon()}</DropdownMenu.Trigger>
                {/snippet}
              </Sidebar.MenuButton>
              <DropdownMenu.Portal to={navigation?.closest('.bcx-side-panel-shell') ?? undefined}>
                <DropdownMenu.Content class="bcx-navigation-menu" side="right" align="start" sideOffset={8} collisionPadding={8} strategy="fixed" aria-label="Tools" onCloseAutoFocus={handleCloseAutoFocus}>
                  <DropdownMenu.RadioGroup value={value} onValueChange={selectFromMenu} aria-label="Tools">
                    {#each tools as section (section.id)}
                      <DropdownMenu.RadioItem value={section.id} class="bcx-navigation-menu-item" title={section.title}>
                        {@render sectionIcon(section)}
                        <span class="bcx-navigation-label">{section.label}</span>
                        <span class="bcx-navigation-check">{#if value === section.id}<Check size={14} aria-hidden="true" />{/if}</span>
                      </DropdownMenu.RadioItem>
                    {/each}
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          {/if}
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Content>
  </nav>
</Sidebar.Root>

<style>
.bcx-navigation-controls { display: flex; align-items: center; gap: 4px; min-width: 0; }
.bcx-main-navigation { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; }
:global(.bcx-navigation-top) { border-bottom: 1px solid #4b5563; }
:global(.bcx-navigation-scroll) { scrollbar-width: thin; scrollbar-color: rgb(156 163 175 / 0.45) transparent; }
:global(.bcx-navigation-tools) { box-sizing: border-box; width: auto; margin: 4px 0 0 18px; padding-left: 8px; border-left: 1px solid #4b5563; }
.bcx-navigation-image { width: 16px; height: 16px; flex-shrink: 0; border-radius: 3px; object-fit: cover; }
.bcx-navigation-status { position: absolute; top: 4px; left: 26px; width: 6px; height: 6px; border-radius: 50%; background: #38bdf8; }
.bcx-navigation-status.error { background: #fbbf24; }
:global(.bcx-navigation-menu) { z-index: 1000000; pointer-events: auto; width: 240px; max-width: calc(100vw - 64px); max-height: min(480px, var(--bits-dropdown-menu-content-available-height)); overflow-y: auto; padding: 4px; border: 1px solid #4b5563; border-radius: 8px; background: #111827; color: #f9fafb; box-shadow: 0 4px 12px rgb(0 0 0 / 25%); scrollbar-width: thin; scrollbar-color: rgb(156 163 175 / 0.45) transparent; }
:global(.bcx-navigation-menu-item) { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; font-size: 0.875rem; cursor: pointer; }
:global(.bcx-navigation-menu-item[data-highlighted]), :global(.bcx-navigation-menu-item[data-state='checked']) { background: #374151; }
:global(.bcx-navigation-menu-item:focus-visible) { outline: 2px solid #04b1fe; outline-offset: -2px; }
:global(.bcx-navigation-menu-item > svg) { flex-shrink: 0; }
.bcx-navigation-label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.bcx-navigation-check { display: inline-flex; width: 14px; flex: 0 0 14px; }
@media (pointer: coarse) { :global(.bcx-navigation-menu-item) { min-height: 44px; } }
</style>
