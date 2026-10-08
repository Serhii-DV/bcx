<script lang="ts">
import {
  ChevronDown,
  Disc,
  ExternalLink,
  Music2,
  Pin,
  UserRound,
} from '@lucide/svelte';
import { Collapsible, DropdownMenu } from 'bits-ui';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { tick, untrack } from 'svelte';
import * as Sidebar from '$lib/components/ui/sidebar/index.js';
import type { PinnedPage } from '../pinnedNavigation';
import { loadPinnedPageImage } from '../pinnedPage';
import {
  changePin,
  pinnedNavigation,
  refreshPinnedNavigation,
} from '../stores/pinnedNavigation';

let {
  value,
  contentId,
  portal,
  menuOpen,
  tooltipDisabled,
  onMenuOpenChange,
  onSelect,
}: {
  value: string;
  contentId: string;
  portal?: Element;
  menuOpen?: string;
  tooltipDisabled: boolean;
  onMenuOpenChange: (id: string, open: boolean) => void;
  onSelect: (page: PinnedPage) => void;
} = $props();
const sidebar = Sidebar.useSidebar();
let pinnedMenu = $state<HTMLUListElement | null>(null);
let expandedPages = $state<Record<string, boolean>>({});
let saving = $state(false);
let error = $state('');
let images = $state<Record<string, string | undefined>>({});
let failedImages = $state<Record<string, string | undefined>>({});
let dragging = $state<string>();
let dropTarget = $state<{ id: string; position: 'before' | 'after' }>();

$effect(() => {
  if (sidebar.open) {
    if (value.startsWith('__pin__')) {
      const id = value.slice('__pin__'.length);
      untrack(() => {
        expandedPages = { ...expandedPages, [id]: true };
      });
    }
  }
});

$effect(() => {
  const pages = $pinnedNavigation.items.filter((page) => !page.image);
  let cancelled = false;
  void Promise.allSettled(
    pages.map(
      async (page) => [page.id, await loadPinnedPageImage(page)] as const,
    ),
  ).then((results) => {
    if (cancelled) return;
    images = Object.fromEntries(
      results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      ),
    );
    if (results.some((result) => result.status === 'rejected'))
      error = 'Could not load pinned artwork. Please retry.';
  });
  return () => {
    cancelled = true;
  };
});

function endDrag() {
  dragging = undefined;
  dropTarget = undefined;
}

function startDrag(event: DragEvent, page: PinnedPage) {
  if (
    event.defaultPrevented ||
    saving ||
    $pinnedNavigation.error ||
    !event.dataTransfer
  ) {
    event.preventDefault();
    return;
  }
  if (menuOpen) onMenuOpenChange(menuOpen, false);
  dragging = page.id;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/x-bcx-pinned-page', page.id);
}

function dragOver(event: DragEvent, page: PinnedPage) {
  if (!dragging || saving || $pinnedNavigation.error) return;
  if (dragging === page.id) {
    dropTarget = undefined;
    return;
  }
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  const row = event.currentTarget;
  if (!(row instanceof HTMLElement)) return;
  const bounds = row.getBoundingClientRect();
  dropTarget = {
    id: page.id,
    position:
      event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after',
  };
}

function drop(event: DragEvent, page: PinnedPage) {
  dragOver(event, page);
  const source = dragging;
  const target = dropTarget;
  endDrag();
  if (source && source !== page.id && target?.id === page.id) {
    event.preventDefault();
    void change({
      action: 'reorder',
      id: source,
      targetId: target.id,
      position: target.position,
    });
  }
}

function reorderWithKeyboard(event: KeyboardEvent, index: number) {
  if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const target =
    $pinnedNavigation.items[index + (event.key === 'ArrowUp' ? -1 : 1)];
  if (target && !saving && !$pinnedNavigation.error) {
    void change({
      action: 'reorder',
      id: $pinnedNavigation.items[index].id,
      targetId: target.id,
      position: event.key === 'ArrowUp' ? 'before' : 'after',
    });
  }
}

async function change(command: Parameters<typeof changePin>[0]) {
  if (saving) return;
  saving = true;
  error = '';
  const navigation = pinnedMenu?.closest('nav');
  const restoreReorderedFocus =
    command.action === 'reorder' &&
    document.activeElement instanceof HTMLElement &&
    document.activeElement.dataset.pinnedPage === command.id;
  const removedIndex =
    command.action === 'unpin'
      ? $pinnedNavigation.items.findIndex((page) => page.id === command.page.id)
      : -1;
  try {
    await changePin(command);
    if (command.action === 'unpin') {
      await tick();
      const selectedAction =
        value === `__pin__${command.page.id}`
          ? document
              .getElementById(`${contentId}-${value}`)
              ?.querySelector<HTMLButtonElement>('button[aria-pressed]')
          : undefined;
      const buttons = navigation?.querySelectorAll<HTMLButtonElement>(
        'button[data-pinned-page]',
      );
      const neighbour = buttons?.[Math.min(removedIndex, buttons.length - 1)];
      (
        selectedAction ??
        neighbour ??
        navigation?.querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')
      )?.focus();
    } else if (command.action === 'reorder' && restoreReorderedFocus) {
      await tick();
      Array.from(
        navigation?.querySelectorAll<HTMLButtonElement>(
          'button[data-pinned-page]',
        ) ?? [],
      )
        .find((button) => button.dataset.pinnedPage === command.id)
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

{#snippet pinContents(page: PinnedPage)}
  {@const Icon = page.kind === 'band' ? UserRound : page.kind === 'track' ? Music2 : Disc}
  {@const image = page.image ?? images[page.id]}
  {#if image && image !== failedImages[page.id]}
    <img src={image} alt="" class="pinned-image" draggable="false" onerror={() => { failedImages = { ...failedImages, [page.id]: image }; }} />
  {:else}
    <Icon size={16} aria-hidden="true" />
  {/if}
  <span data-sidebar-label class="pinned-identity"><span>{page.title}</span>{#if page.artistName}<small>{page.artistName}</small>{/if}</span>
  {#if sidebar.open}<ChevronDown size={14} class={expandedPages[page.id] ? 'rotate-180' : ''} aria-hidden="true" />{/if}
{/snippet}

{#snippet pinButton(page: PinnedPage, index: number)}
  <Sidebar.MenuButton data-pinned-page={page.id} isActive={value === `__pin__${page.id}`} aria-current={value === `__pin__${page.id}` && (!sidebar.open || !expandedPages[page.id]) ? 'page' : undefined} aria-label={`${page.title}${page.artistName ? ` by ${page.artistName}` : ''}`} aria-describedby={`${contentId}-pin-reordering`} tooltipDisabled={tooltipDisabled || !!dragging} tooltipPortal={portal} draggable={!saving && !$pinnedNavigation.error} ondragstart={(event) => startDrag(event, page)} ondragend={endDrag} onkeydown={(event) => reorderWithKeyboard(event, index)}>
    {#snippet tooltipContent()}<strong>{page.title}</strong>{#if page.artistName}<p>{page.artistName}</p>{/if}<p>{page.kind} · {page.url}</p>{/snippet}
    {#snippet child({ props })}
      {#if sidebar.open}
        <Collapsible.Trigger {...props}>{@render pinContents(page)}</Collapsible.Trigger>
      {:else}
        <DropdownMenu.Trigger {...props}>{@render pinContents(page)}</DropdownMenu.Trigger>
      {/if}
    {/snippet}
  </Sidebar.MenuButton>
{/snippet}

{#if $pinnedNavigation.items.length || $pinnedNavigation.error}
  <Sidebar.Separator />
  <div class="pinned-heading" aria-hidden="true"><Pin size={12} /><span data-sidebar-label>Pinned</span></div>
  <span id={`${contentId}-pin-reordering`} class="sr-only">Drag to reorder pinned pages, or use Alt + Arrow Up or Arrow Down when focused.</span>
  <Sidebar.Menu bind:ref={pinnedMenu} aria-label="Pinned pages">
    {#each $pinnedNavigation.items as page, index (page.id)}
      {@const id = `__pin__${page.id}`}
      <Sidebar.MenuItem class={`pinned-row${dragging === page.id ? ' dragging' : ''}`} data-drop-position={dropTarget?.id === page.id ? dropTarget.position : undefined} ondragover={(event) => dragOver(event, page)} ondrop={(event) => drop(event, page)}>
        {#if sidebar.open}
          <Collapsible.Root open={!!expandedPages[page.id]} onOpenChange={(open) => { expandedPages = { ...expandedPages, [page.id]: open }; }}>
            {@render pinButton(page, index)}
            <Collapsible.Content>
              <Sidebar.Menu class="bcx-navigation-tools" aria-label={`Actions for pinned ${page.title}`}>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton isActive={value === id} aria-current={value === id ? 'page' : undefined} aria-controls={`${contentId}-${id}`} onclick={() => onSelect(page)}><span>Open in BCX</span></Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    {#snippet child({ props })}<a {...props} href={page.url} onclick={(event) => { void openPage(event, page.url); }}><ExternalLink size={14} aria-hidden="true" /><span>Open on Bandcamp</span></a>{/snippet}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton disabled={saving || !!$pinnedNavigation.error} onclick={() => void change({ action: 'unpin', page })}><Pin size={14} aria-hidden="true" /><span>Unpin {page.kind}</span></Sidebar.MenuButton>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Collapsible.Content>
          </Collapsible.Root>
        {:else}
          <DropdownMenu.Root open={menuOpen === page.id} onOpenChange={(open) => onMenuOpenChange(page.id, open)}>
            {@render pinButton(page, index)}
            <DropdownMenu.Portal to={portal}>
              <DropdownMenu.Content class="bcx-navigation-menu" data-bcx-sidebar-menu aria-label={`Actions for pinned ${page.title}`} side="right" align="start" sideOffset={8} collisionPadding={8} strategy="fixed">
                <DropdownMenu.Item class="bcx-navigation-menu-item" aria-current={value === id ? 'page' : undefined} onSelect={() => onSelect(page)}>Open in BCX</DropdownMenu.Item>
                <DropdownMenu.Item class="bcx-navigation-menu-item">
                  {#snippet child({ props })}<a {...props} href={page.url} onclick={(event) => { if (typeof props.onclick === 'function') props.onclick(event); void openPage(event, page.url); }}>Open on Bandcamp</a>{/snippet}
                </DropdownMenu.Item>
                <DropdownMenu.Item class="bcx-navigation-menu-item" disabled={saving || !!$pinnedNavigation.error} onSelect={() => void change({ action: 'unpin', page })}><Pin size={14} aria-hidden="true" />Unpin {page.kind}</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        {/if}
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
  {#if $pinnedNavigation.error || error}
    <div class="pinned-error" role="alert">
      <span data-sidebar-label>{$pinnedNavigation.error || error}</span>
      <button type="button" onclick={() => { error = ''; failedImages = {}; void refreshPinnedNavigation(); }}>Retry</button>
    </div>
  {/if}
{/if}

<style>
.pinned-heading { display: flex; align-items: center; gap: 8px; padding: 4px 10px; color: #9ca3af; font-size: 0.6875rem; }
.pinned-identity { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.pinned-identity > span, .pinned-identity > small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pinned-identity > small { font-size: 0.6875rem; color: #9ca3af; }
:global(.pinned-row) { position: relative; }
:global(.pinned-row.dragging) { opacity: 0.5; }
:global(.pinned-row[data-drop-position])::after { content: ''; position: absolute; left: 0; right: 0; height: 2px; background: #38bdf8; pointer-events: none; }
:global(.pinned-row[data-drop-position='before'])::after { top: -2px; }
:global(.pinned-row[data-drop-position='after'])::after { bottom: -2px; }
.pinned-image { width: 16px; height: 16px; flex-shrink: 0; border-radius: 3px; object-fit: cover; }
.pinned-error button:focus-visible { outline: 2px solid #38bdf8; }
.pinned-error { padding: 4px; color: #fca5a5; font-size: 0.6875rem; overflow-wrap: anywhere; }
.pinned-error button { display: block; text-decoration: underline; cursor: pointer; }
:global(.bcx-navigation-menu-item[data-disabled]) { opacity: 0.4; cursor: default; }
</style>
