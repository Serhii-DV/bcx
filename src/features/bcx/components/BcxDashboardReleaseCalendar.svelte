<script lang="ts">
import { ArrowRight, CalendarDays } from '@lucide/svelte';
import { Tabs } from 'bits-ui';
import { watchMusicLibrary } from 'src/bandcamp/domain/storage/musicLibrary';
import { loadCalendarReleases } from 'src/features/treeview/items/calendarReleases';
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';
import { watchLocalCalendarDay } from '../watchLocalCalendarDay';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

let { onOpen }: { onOpen?: () => void } = $props();

const tabs = [
  {
    id: 'upcoming',
    label: 'Upcoming',
    emptyMessage: 'No upcoming releases in your saved library.',
  },
  {
    id: 'recent',
    label: 'Recently Released',
    emptyMessage: 'No saved releases in the last 30 calendar days.',
  },
];
const headingId = $props.id();
let view = $state('upcoming');
let data = $state<Record<string, TreeData>>({});
let loading = $state(true);
let error = $state('');
let generation = 0;

function createWidgetTree(items: TreeItem[]): TreeData {
  const tree = new TreeData([], TREE_ITEM_LAYOUT.BROWSER);
  for (const item of items.slice(0, 3)) tree.add(item);
  return tree;
}

async function loadReleases() {
  const request = ++generation;
  loading = true;
  error = '';
  try {
    const { upcoming, recent } = await loadCalendarReleases();
    if (request !== generation) return;
    data = {
      upcoming: createWidgetTree(upcoming),
      recent: createWidgetTree(recent),
    };
  } catch (reason) {
    if (request === generation)
      error = getErrorMessage(reason, 'Could not load releases.');
  } finally {
    if (request === generation) loading = false;
  }
}

onMount(() => {
  const refresh = () => void loadReleases();
  const stopWatchingLibrary = watchMusicLibrary(refresh);
  const stopWatchingDate = watchLocalCalendarDay(refresh);
  refresh();
  return () => {
    generation++;
    stopWatchingLibrary();
    stopWatchingDate();
  };
});
</script>

{#snippet headingContent()}
  <CalendarDays size={16} aria-hidden="true" />Release Calendar
{/snippet}

<section class="calendar" aria-labelledby={headingId} aria-busy={loading}>
  <h2 id={headingId}>
    {#if onOpen}
      <button type="button" class="calendar-heading-link" onclick={onOpen}>
        {@render headingContent()} <ArrowRight size={14} aria-hidden="true" />
      </button>
    {:else}
      {@render headingContent()}
    {/if}
  </h2>
  <Tabs.Root bind:value={view}>
    <Tabs.List aria-label="Release Calendar views" class="flex flex-wrap gap-1">
      {#each tabs as tab (tab.id)}
        <Tabs.Trigger value={tab.id} class="bcx-section-tab">{tab.label}</Tabs.Trigger>
      {/each}
    </Tabs.List>
    {#each tabs as tab (tab.id)}
      {@const tree = data[tab.id]}
      <Tabs.Content value={tab.id} class="pt-1">
        {#if error}
          <p class="error" role="alert">
            {error} <button type="button" onclick={() => void loadReleases()}>Retry</button>
          </p>
        {:else if tree?.items.length}
          <BcxTreeBrowser treeData={tree} showFilter={false} showBreadcrumb={false} nativeTabNavigation={true} />
        {:else if loading}
          <p class="empty" role="status">Loading releases…</p>
        {:else}
          <p class="empty">{tab.emptyMessage}</p>
        {/if}
      </Tabs.Content>
    {/each}
  </Tabs.Root>
</section>

<style>
  .calendar { min-width: 0; margin-bottom: 24px; }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 0.875rem; font-weight: 600; }
  .empty { margin: 0; color: #9ca3af; font-size: 0.875rem; line-height: 1.5; }
  .error { color: #fca5a5; font-size: 0.875rem; line-height: 1.5; }
  button { padding: 2px 6px; border: 0; border-radius: 4px; background: rgb(255 255 255 / 8%); color: inherit; cursor: pointer; }
  button:hover { background: rgb(255 255 255 / 10%); }
  button:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
  .calendar-heading-link { display: inline-flex; align-items: center; gap: 8px; padding: 0; background: transparent; }
  .calendar-heading-link:hover { background: transparent; text-decoration: underline; }
</style>
