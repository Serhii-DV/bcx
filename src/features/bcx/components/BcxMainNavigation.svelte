<script lang="ts">
import {
  Check,
  Disc,
  Folder,
  Menu,
  Settings2,
  UserRound,
} from '@lucide/svelte';
import { DropdownMenu, Tooltip } from 'bits-ui';
import { makeIcon } from 'src/features/treeview/utils/icon';
import { tick } from 'svelte';

interface NavigationSection {
  id: string;
  label: string;
  image?: string;
  title?: string;
}

type MenuName = 'all' | 'tools';

let {
  sections,
  tools,
  value = $bindable(),
  contentId,
  syncStatus,
}: {
  sections: NavigationSection[];
  tools: NavigationSection[];
  value: string;
  contentId: string;
  syncStatus?: 'running' | 'error';
} = $props();

let navigation = $state<HTMLElement>();
let openMenu = $state<MenuName | null>(null);
let focusSelectedOnClose = false;
const contextSections = $derived(
  sections.filter((section) => isContext(section)),
);
const followingSections = $derived(
  sections.filter((section) => isFollowing(section)),
);
const librarySections = $derived(
  sections.filter((section) => !isContext(section) && !isFollowing(section)),
);
const groups = $derived(
  [
    { id: 'context', label: 'Current page', sections: contextSections },
    {
      id: 'library',
      label: 'Library',
      sections: [...librarySections, ...followingSections],
    },
    { id: 'tools', label: 'Tools', sections: tools },
  ].filter((group) => group.sections.length),
);
const toolsTitle = $derived(
  syncStatus === 'error'
    ? 'Tools — Sync needs attention.'
    : syncStatus === 'running'
      ? 'Tools — Sync in progress.'
      : 'Tools',
);

function isContext(section: NavigationSection) {
  return section.id.startsWith('band-') || section.id.startsWith('fan-');
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

function selectSection(id: string) {
  focusSelectedOnClose = true;
  value = id;
}

async function handleCloseAutoFocus(event: Event) {
  if (!focusSelectedOnClose) return;
  event.preventDefault();
  focusSelectedOnClose = false;
  await tick();
  focusSelected();
}
</script>

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
  <Tooltip.Root disabled={openMenu !== null} ignoreNonKeyboardFocus>
  <Tooltip.Trigger
    class="bcx-navigation-button"
    aria-label={section.label}
    aria-current={value === section.id ? 'page' : undefined}
    aria-controls={`${contentId}-${section.id}`}
    onclick={() => { openMenu = null; value = section.id; }}
  >
    {@render sectionIcon(section)}
  </Tooltip.Trigger>
  {@render hoverCard(section.label, section.title)}
  </Tooltip.Root>
{/snippet}

{#snippet hoverCard(label: string, description?: string)}
  <Tooltip.Portal to={navigation?.closest('.bcx-side-panel-shell') ?? undefined}>
    <Tooltip.Content class="bcx-navigation-hover-card" side="right" align="start" sideOffset={8} collisionPadding={8} strategy="fixed">
      <strong>{label}</strong>
      {#if description}<p>{description}</p>{/if}
    </Tooltip.Content>
  </Tooltip.Portal>
{/snippet}

{#snippet navigationMenu(name: MenuName)}
  {@const label = name === 'all' ? 'Navigation' : 'Tools'}
  {@const description = name === 'all' ? 'Show all available navigation sections.' : `Sync, storage, activity log, and extension information.${syncStatus === 'error' ? ' Sync needs attention.' : syncStatus === 'running' ? ' Sync is in progress.' : ''}`}
  {@const menuGroups = name === 'all' ? groups : groups.filter((group) => group.id === name)}
  {@const current = name !== 'all' && menuGroups.some((group) => group.sections.some((section) => section.id === value))}
  {#snippet menuItems()}
    {#each menuGroups as group, index (group.id)}
      {#if group.id === 'tools' && index > 0}
        <DropdownMenu.Separator class="bcx-navigation-menu-divider" />
      {/if}
      <DropdownMenu.RadioGroup value={value} onValueChange={selectSection} aria-label={group.label}>
        <DropdownMenu.GroupHeading class="bcx-navigation-group-heading">{group.label}</DropdownMenu.GroupHeading>
        {#each group.sections as section (section.id)}
          <DropdownMenu.RadioItem value={section.id} class="bcx-navigation-menu-item" title={section.title}>
            {@render sectionIcon(section)}
            <span class="bcx-navigation-label">{section.label}</span>
            <span class="bcx-navigation-check">{#if value === section.id}<Check size={14} aria-hidden="true" />{/if}</span>
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    {/each}
  {/snippet}
  <Tooltip.Root disabled={openMenu !== null} ignoreNonKeyboardFocus>
  <DropdownMenu.Root open={openMenu === name} onOpenChange={(open) => { openMenu = open ? name : openMenu === name ? null : openMenu; }}>
    <Tooltip.Trigger>
    {#snippet child({ props })}
    <DropdownMenu.Trigger
      {...props}
      class="bcx-navigation-button"
      aria-label={name === 'tools' ? toolsTitle : label}
      aria-current={current ? 'page' : undefined}
    >
      {#if name === 'all'}<Menu size={16} aria-hidden="true" />
      {:else}<Settings2 size={16} aria-hidden="true" />{/if}
      {#if name === 'tools' && syncStatus}
        <span class="bcx-navigation-status" class:error={syncStatus === 'error'} aria-hidden="true"></span>
      {/if}
    </DropdownMenu.Trigger>
    {/snippet}
    </Tooltip.Trigger>
    {#if name === 'all'}
      <DropdownMenu.Portal to={navigation?.parentElement ?? undefined}>
        <DropdownMenu.ContentStatic class="bcx-navigation-menu bcx-navigation-menu-full" aria-label={label} onCloseAutoFocus={handleCloseAutoFocus}>
          {@render menuItems()}
        </DropdownMenu.ContentStatic>
      </DropdownMenu.Portal>
    {:else}
    <DropdownMenu.Portal to={navigation?.closest('.bcx-side-panel-shell') ?? undefined}>
      <DropdownMenu.Content class="bcx-navigation-menu" side="right" align="start" sideOffset={8} collisionPadding={8} strategy="fixed" aria-label={label} onCloseAutoFocus={handleCloseAutoFocus}>
        {@render menuItems()}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
    {/if}
  </DropdownMenu.Root>
  {@render hoverCard(label, description)}
  </Tooltip.Root>
{/snippet}

<Tooltip.Provider delayDuration={250}>
<nav bind:this={navigation} class="bcx-main-navigation" aria-label="Music Explorer sections">
  <div class="bcx-navigation-top">{@render navigationMenu('all')}</div>
  <div class="bcx-navigation-scroll">
    {#each contextSections as section (section.id)}{@render sectionButton(section)}{/each}
    {#if contextSections.length && (librarySections.length || followingSections.length)}<div class="bcx-navigation-divider"></div>{/if}
    {#each librarySections as section (section.id)}{@render sectionButton(section)}{/each}
    {#each followingSections as section (section.id)}{@render sectionButton(section)}{/each}
    <div class="bcx-navigation-divider"></div>
    {@render navigationMenu('tools')}
  </div>
</nav>
</Tooltip.Provider>

<style>
.bcx-main-navigation { box-sizing: border-box; display: flex; flex: 0 0 48px; flex-direction: column; align-items: stretch; min-height: 0; padding: 4px; border-right: 1px solid #4b5563; background: rgb(17 24 39 / 60%); }
.bcx-navigation-top { display: flex; flex-shrink: 0; justify-content: center; padding: 4px 0; }
.bcx-navigation-top { border-bottom: 1px solid #4b5563; }
.bcx-navigation-scroll { display: flex; flex: 1 1 0%; flex-direction: column; align-items: center; gap: 4px; min-height: 0; padding: 8px 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgb(156 163 175 / 0.45) transparent; }
:global(.bcx-navigation-button) { position: relative; display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: #d1d5db; cursor: pointer; }
:global(.bcx-navigation-button:hover), :global(.bcx-navigation-button[aria-current='page']), :global(.bcx-navigation-button[data-state='open']) { background: #374151; color: #f9fafb; }
:global(.bcx-navigation-button[aria-current='page']) { box-shadow: inset 2px 0 #38bdf8; }
:global(.bcx-navigation-button:focus-visible), :global(.bcx-navigation-menu-item:focus-visible) { outline: 2px solid #04b1fe; outline-offset: -2px; }
.bcx-navigation-image { width: 16px; height: 16px; flex-shrink: 0; border-radius: 3px; object-fit: cover; }
.bcx-navigation-divider { width: 24px; height: 1px; flex-shrink: 0; margin: 4px 0; background: #4b5563; }
.bcx-navigation-status { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: #38bdf8; }
.bcx-navigation-status.error { background: #fbbf24; }
:global(.bcx-navigation-menu) { z-index: 1000000; pointer-events: auto; width: 240px; max-width: calc(100vw - 64px); max-height: min(480px, var(--bits-dropdown-menu-content-available-height)); overflow-y: auto; padding: 4px; border: 1px solid #4b5563; border-radius: 8px; background: #111827; color: #f9fafb; box-shadow: 0 4px 12px rgb(0 0 0 / 25%); scrollbar-width: thin; scrollbar-color: rgb(156 163 175 / 0.45) transparent; }
:global(.bcx-navigation-menu-full) { box-sizing: border-box; position: absolute; inset: 0 auto 0 48px; height: 100%; max-height: none; max-width: calc(100% - 48px); overflow: visible; border-radius: 0 8px 8px 0; }
:global(.bcx-navigation-hover-card) { z-index: 1000000; box-sizing: border-box; width: 260px; max-width: calc(100vw - 64px); padding: 12px; border: 1px solid #4b5563; border-radius: 8px; background: #111827; color: #f9fafb; font-size: 0.875rem; box-shadow: 0 4px 12px rgb(0 0 0 / 25%); overflow-wrap: anywhere; }
:global(.bcx-navigation-hover-card strong) { display: block; font-weight: 600; }
:global(.bcx-navigation-hover-card p) { margin: 4px 0 0; color: #9ca3af; font-size: 0.75rem; line-height: 1.5; }
:global(.bcx-navigation-group-heading) { padding: 8px 8px 4px; font-size: 0.75rem; color: #9ca3af; }
:global(.bcx-navigation-menu-divider) { height: 1px; margin: 4px; background: #4b5563; }
:global(.bcx-navigation-menu-item) { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; font-size: 0.875rem; cursor: pointer; }
:global(.bcx-navigation-menu-item[data-highlighted]), :global(.bcx-navigation-menu-item[data-state='checked']) { background: #374151; }
:global(.bcx-navigation-menu-item > svg) { flex-shrink: 0; }
.bcx-navigation-label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.bcx-navigation-check { display: inline-flex; width: 14px; flex: 0 0 14px; }
@media (pointer: coarse) { :global(.bcx-navigation-button) { height: 44px; } :global(.bcx-navigation-menu-item) { min-height: 44px; } }
</style>
