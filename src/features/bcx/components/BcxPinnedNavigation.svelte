<script lang="ts">
import { Disc, Music2, Pin, PinOff, UserRound } from '@lucide/svelte';
import { openUrlInActiveTab } from 'src/core/extensionActions';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { tick } from 'svelte';
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
  tooltipDisabled,
  onPreview,
  selectedPinId,
}: {
  value: string;
  contentId: string;
  portal?: Element;
  tooltipDisabled: boolean;
  onPreview: (page: PinnedPage) => void;
  selectedPinId?: string;
} = $props();
const sidebar = Sidebar.useSidebar();
let pinnedMenu = $state<HTMLUListElement | null>(null);
let saving = $state(false);
let error = $state('');
let images = $state<Record<string, string | undefined>>({});
let failedImages = $state<Record<string, string | undefined>>({});
let dragging = $state<string>();
let dropTarget = $state<{ id: string; position: 'before' | 'after' }>();

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
        selectedPinId === command.page.id
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
{/snippet}

{#if $pinnedNavigation.items.length || $pinnedNavigation.error}
  <div class="pinned-heading" aria-hidden="true"><Pin size={12} /><span data-sidebar-label>Pinned</span></div>
  <span id={`${contentId}-pin-reordering`} class="sr-only">Double-click to open on Bandcamp. Drag to reorder pinned pages, or use Alt + Arrow Up or Arrow Down when focused.</span>
  <Sidebar.Menu bind:ref={pinnedMenu} aria-label="Pinned pages">
    {#each $pinnedNavigation.items as page, index (page.id)}
      <Sidebar.MenuItem class={`pinned-row${sidebar.open ? ' with-unpin' : ''}${dragging === page.id ? ' dragging' : ''}`} data-drop-position={dropTarget?.id === page.id ? dropTarget.position : undefined} ondragover={(event) => dragOver(event, page)} ondrop={(event) => drop(event, page)}>
        <Sidebar.MenuButton data-pinned-page={page.id} isActive={selectedPinId === page.id} aria-current={selectedPinId === page.id ? 'page' : undefined} aria-controls={selectedPinId === page.id ? `${contentId}-${value}` : undefined} aria-label={`${page.title}${page.artistName ? ` by ${page.artistName}` : ''}`} aria-describedby={`${contentId}-pin-reordering`} tooltipDisabled={tooltipDisabled || !!dragging} tooltipPortal={portal} draggable={!saving && !$pinnedNavigation.error} onclick={() => onPreview(page)} ondragstart={(event) => startDrag(event, page)} ondragend={endDrag} onkeydown={(event) => reorderWithKeyboard(event, index)} ondblclick={(event) => { event.stopPropagation(); void openPage(event, page.url); }}>
          {#snippet tooltipContent()}<strong>{page.title}</strong>{#if page.artistName}<p>{page.artistName}</p>{/if}<p>{page.kind} · {page.url}</p><p>Click to view details. Double-click to open on Bandcamp.</p>{/snippet}
          {@render pinContents(page)}
        </Sidebar.MenuButton>
        {#if sidebar.open}
          <button type="button" class="pinned-unpin" aria-label={`Unpin ${page.title}`} title={`Unpin ${page.title}`} disabled={saving || !!$pinnedNavigation.error} onclick={() => void change({ action: 'unpin', page })}>
            <PinOff size={14} aria-hidden="true" />
          </button>
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
  <Sidebar.Separator />
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
:global(.pinned-row.with-unpin > .sidebar-menu-button) { padding-right: 36px; }
.pinned-unpin { position: absolute; top: 50%; right: 4px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; transform: translateY(-50%); border: 0; border-radius: 4px; color: #9ca3af; background: transparent; cursor: pointer; }
.pinned-unpin:hover { color: #f9fafb; background: #4b5563; }
.pinned-unpin:focus-visible { outline: 2px solid #04b1fe; outline-offset: -2px; }
.pinned-unpin:disabled { opacity: 0.4; cursor: default; }
</style>
