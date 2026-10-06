<script lang="ts">
import {
  Check,
  Disc,
  Folder,
  Headphones,
  Menu,
  Settings2,
  UserRound,
} from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { makeIcon } from 'src/features/treeview/utils/icon';
import { tick } from 'svelte';

interface NavigationSection {
  id: string;
  label: string;
  image?: string;
  title?: string;
}

type MenuName = 'all' | 'following' | 'tools';

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
    { id: 'library', label: 'Library', sections: librarySections },
    { id: 'following', label: 'Following', sections: followingSections },
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
  <button
    type="button"
    class="bcx-navigation-button"
    aria-label={section.label}
    aria-current={value === section.id ? 'page' : undefined}
    aria-controls={`${contentId}-${section.id}`}
    title={section.title ?? section.label}
    onclick={() => { openMenu = null; value = section.id; }}
  >
    {@render sectionIcon(section)}
  </button>
{/snippet}

{#snippet navigationMenu(name: MenuName)}
  {@const label = name === 'all' ? 'Navigation' : name === 'following' ? 'Following' : 'Tools'}
  {@const menuGroups = name === 'all' ? groups : groups.filter((group) => group.id === name)}
  {@const current = name !== 'all' && menuGroups.some((group) => group.sections.some((section) => section.id === value))}
  <DropdownMenu.Root open={openMenu === name} onOpenChange={(open) => { openMenu = open ? name : openMenu === name ? null : openMenu; }}>
    <DropdownMenu.Trigger
      class="bcx-navigation-button"
      aria-label={name === 'tools' ? toolsTitle : label}
      aria-current={current ? 'page' : undefined}
      title={name === 'tools' ? toolsTitle : name === 'all' ? 'Show all navigation sections' : 'Browse followed bands and genres'}
    >
      {#if name === 'all'}<Menu size={16} aria-hidden="true" />
      {:else if name === 'following'}<Headphones size={16} aria-hidden="true" />
      {:else}<Settings2 size={16} aria-hidden="true" />{/if}
      {#if name === 'tools' && syncStatus}
        <span class="bcx-navigation-status" class:error={syncStatus === 'error'} aria-hidden="true"></span>
      {/if}
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal to={navigation?.closest('.bcx-side-panel-shell') ?? undefined}>
      <DropdownMenu.Content class="bcx-navigation-menu" side="right" align={name === 'tools' ? 'end' : 'start'} sideOffset={8} collisionPadding={8} strategy="fixed" aria-label={label} onCloseAutoFocus={handleCloseAutoFocus}>
        {#each menuGroups as group (group.id)}
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
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
{/snippet}

<nav bind:this={navigation} class="bcx-main-navigation" aria-label="Music Explorer sections">
  <div class="bcx-navigation-top">{@render navigationMenu('all')}</div>
  <div class="bcx-navigation-scroll">
    {#each contextSections as section (section.id)}{@render sectionButton(section)}{/each}
    {#if contextSections.length && librarySections.length}<div class="bcx-navigation-divider"></div>{/if}
    {#each librarySections as section (section.id)}{@render sectionButton(section)}{/each}
    {#if followingSections.length}{@render navigationMenu('following')}{/if}
  </div>
  <div class="bcx-navigation-bottom">{@render navigationMenu('tools')}</div>
</nav>

<style>
.bcx-main-navigation { box-sizing: border-box; display: flex; flex: 0 0 48px; flex-direction: column; align-items: stretch; min-height: 0; padding: 4px; border-right: 1px solid #4b5563; background: rgb(17 24 39 / 60%); }
.bcx-navigation-top, .bcx-navigation-bottom { display: flex; flex-shrink: 0; justify-content: center; padding: 4px 0; }
.bcx-navigation-top { border-bottom: 1px solid #4b5563; }
.bcx-navigation-bottom { border-top: 1px solid #4b5563; }
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
:global(.bcx-navigation-group-heading) { padding: 8px 8px 4px; font-size: 0.75rem; color: #9ca3af; }
:global(.bcx-navigation-menu-item) { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; font-size: 0.875rem; cursor: pointer; }
:global(.bcx-navigation-menu-item[data-highlighted]), :global(.bcx-navigation-menu-item[data-state='checked']) { background: #374151; }
:global(.bcx-navigation-menu-item > svg) { flex-shrink: 0; }
.bcx-navigation-label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.bcx-navigation-check { display: inline-flex; width: 14px; flex: 0 0 14px; }
@media (pointer: coarse) { :global(.bcx-navigation-button) { height: 44px; } :global(.bcx-navigation-menu-item) { min-height: 44px; } }
</style>
