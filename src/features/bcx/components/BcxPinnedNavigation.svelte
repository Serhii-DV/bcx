<script lang="ts">
import {
  ArrowDown,
  ArrowUp,
  Disc,
  MoreHorizontal,
  Music2,
  Pin,
  UserRound,
} from '@lucide/svelte';
import { DropdownMenu } from 'bits-ui';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { tick } from 'svelte';
import * as Sidebar from '$lib/components/ui/sidebar/index.js';
import type { PinnedPage } from '../pinnedNavigation';
import {
  changePin,
  pinnedNavigation,
  refreshPinnedNavigation,
} from '../stores/pinnedNavigation';

let {
  value,
  contentId,
  portal,
  onSelect,
}: {
  value: string;
  contentId: string;
  portal?: Element;
  onSelect: (page: PinnedPage) => void;
} = $props();
const sidebar = Sidebar.useSidebar();
let menuOpen = $state<string>();
let saving = $state(false);
let error = $state('');

async function change(command: Parameters<typeof changePin>[0]) {
  if (saving) return;
  saving = true;
  error = '';
  try {
    await changePin(command);
    if (command.action === 'unpin' && value === `__pin__${command.page.id}`) {
      await tick();
      document
        .getElementById(`${contentId}-${value}`)
        ?.querySelector<HTMLButtonElement>('button[aria-pressed]')
        ?.focus();
    }
  } catch (reason) {
    error = getErrorMessage(reason, 'Could not update pinned navigation.');
  } finally {
    saving = false;
  }
}

async function openPage(event: MouseEvent, url: string) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  error = '';
  try {
    if (!(await openUrlInActiveTab(url))) window.location.assign(url);
  } catch (reason) {
    error = getErrorMessage(reason, 'Could not open the Bandcamp page.');
  }
}
</script>

{#if $pinnedNavigation.items.length || $pinnedNavigation.error}
  <Sidebar.Separator />
  <div class="pinned-heading" aria-hidden="true"><Pin size={12} /><span data-sidebar-label>Pinned</span></div>
  <Sidebar.Menu aria-label="Pinned pages">
    {#each $pinnedNavigation.items as page, index (page.id)}
      {@const id = `__pin__${page.id}`}
      {@const Icon = page.kind === 'band' ? UserRound : page.kind === 'track' ? Music2 : Disc}
      <Sidebar.MenuItem class="pinned-row">
        <Sidebar.MenuButton isActive={value === id} aria-current={value === id ? 'page' : undefined} aria-controls={`${contentId}-${id}`} aria-label={`${page.title}${page.artistName ? ` by ${page.artistName}` : ''}`} tooltipDisabled={!!menuOpen} tooltipPortal={portal} title={`${page.title}${page.artistName ? `\n${page.artistName}` : ''}\n${page.url}`} onclick={() => onSelect(page)}>
          {#snippet tooltipContent()}<strong>{page.title}</strong>{#if page.artistName}<p>{page.artistName}</p>{/if}<p>{page.kind} · {page.url}</p>{/snippet}
          <Icon size={16} aria-hidden="true" />
          <span data-sidebar-label class="pinned-identity"><span>{page.title}</span>{#if page.artistName}<small>{page.artistName}</small>{/if}</span>
        </Sidebar.MenuButton>
        <DropdownMenu.Root open={menuOpen === page.id} onOpenChange={(open) => { menuOpen = open ? page.id : undefined; }}>
          <DropdownMenu.Trigger class={`pinned-menu-trigger${sidebar.open ? '' : ' collapsed'}`} aria-label={`Actions for pinned ${page.title}`} title={`Actions for pinned ${page.title}`}><MoreHorizontal size={14} aria-hidden="true" /></DropdownMenu.Trigger>
          <DropdownMenu.Portal to={portal}>
            <DropdownMenu.Content class="bcx-navigation-menu" data-bcx-sidebar-menu side="right" align="start" sideOffset={8} collisionPadding={8} strategy="fixed">
              <DropdownMenu.Item class="bcx-navigation-menu-item">
                {#snippet child({ props })}<a {...props} href={page.url} onclick={(event) => { if (typeof props.onclick === 'function') props.onclick(event); void openPage(event, page.url); }}>Open on Bandcamp</a>{/snippet}
              </DropdownMenu.Item>
              <DropdownMenu.Item class="bcx-navigation-menu-item" disabled={saving || index === 0 || !!$pinnedNavigation.error} onSelect={() => void change({ action: 'move', id: page.id, direction: 'up' })}><ArrowUp size={14} aria-hidden="true" />Move up</DropdownMenu.Item>
              <DropdownMenu.Item class="bcx-navigation-menu-item" disabled={saving || index === $pinnedNavigation.items.length - 1 || !!$pinnedNavigation.error} onSelect={() => void change({ action: 'move', id: page.id, direction: 'down' })}><ArrowDown size={14} aria-hidden="true" />Move down</DropdownMenu.Item>
              <DropdownMenu.Item class="bcx-navigation-menu-item" disabled={saving || !!$pinnedNavigation.error} onSelect={() => void change({ action: 'unpin', page })}><Pin size={14} aria-hidden="true" />Unpin {page.kind}</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
  {#if $pinnedNavigation.error || error}
    <div class="pinned-error" role="alert" title={$pinnedNavigation.error || error}>
      <span data-sidebar-label>{$pinnedNavigation.error || error}</span>
      <button type="button" onclick={() => { error = ''; void refreshPinnedNavigation(); }}>Retry</button>
    </div>
  {/if}
{/if}

<style>
.pinned-heading { display: flex; align-items: center; gap: 8px; padding: 4px 10px; color: #9ca3af; font-size: 0.6875rem; }
.pinned-identity { display: flex; flex: 1; flex-direction: column; min-width: 0; padding-right: 18px; }
.pinned-identity > span, .pinned-identity > small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pinned-identity > small { font-size: 0.6875rem; color: #9ca3af; }
:global(.pinned-row) { position: relative; }
.pinned-menu-trigger { position: absolute; right: 2px; top: 8px; display: grid; place-items: center; width: 24px; height: 24px; border: 0; border-radius: 4px; background: #111827; color: #d1d5db; cursor: pointer; }
.pinned-menu-trigger.collapsed { right: 0; top: 0; width: 16px; height: 16px; opacity: 0; }
:global(.pinned-row:hover) .pinned-menu-trigger, :global(.pinned-row:focus-within) .pinned-menu-trigger { opacity: 1; }
.pinned-menu-trigger:hover { background: #374151; color: #fff; }
.pinned-menu-trigger:focus-visible, .pinned-error button:focus-visible { outline: 2px solid #38bdf8; }
.pinned-error { padding: 4px; color: #fca5a5; font-size: 0.6875rem; overflow-wrap: anywhere; }
.pinned-error button { display: block; text-decoration: underline; cursor: pointer; }
:global(.bcx-navigation-menu-item[data-disabled]) { opacity: 0.4; cursor: default; }
@media (pointer: coarse) { .pinned-menu-trigger.collapsed { opacity: 1; } }
</style>
