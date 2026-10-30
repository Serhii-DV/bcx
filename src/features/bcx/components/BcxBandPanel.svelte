<script lang="ts">
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import {
  ICON_DISC,
  ICON_INFO,
  ICON_MENU,
} from 'src/features/treeview/utils/icon';
import type { Snippet } from 'svelte';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import {
  isSectionItemSelected,
  type SectionNavigation,
} from './sectionNavigation';

let {
  treeData,
  about,
  fallbackLocation,
  bandUrl,
  initialSelectedHref,
  loading = false,
  error = '',
  navigationInFilter = false,
  onNavigationChange,
  leadingActions,
  trailingActions,
}: {
  treeData?: TreeData;
  about?: TreeItem;
  fallbackLocation?: string;
  bandUrl?: string;
  initialSelectedHref?: string;
  loading?: boolean;
  error?: string;
  navigationInFilter?: boolean;
  onNavigationChange?: (navigation: SectionNavigation | undefined) => void;
  leadingActions?: Snippet;
  trailingActions?: Snippet;
} = $props();
let content = $state<HTMLDivElement>();
let verticalNavigation = $state(false);

$effect(() => {
  const element = content;
  if (!element) return;
  const measure = () => {
    verticalNavigation = element.clientWidth >= 640;
  };
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  measure();
  return () => observer.disconnect();
});

let catalogNavigation = $state<SectionNavigation>();
const viewActions = $derived(
  catalogNavigation?.items.map(
    ({ id, label, count, image, title, contentId }) => ({
      id,
      label:
        id === 'band-about'
          ? (bandAbout?.aboutProfile?.name ?? 'Band')
          : label === 'Release years'
            ? 'Years'
            : label,
      count,
      keepLabelWhenCompact:
        id === 'band-about' || label === 'Releases' || label === 'Artists',
      image:
        id === 'band-about'
          ? (bandAbout?.aboutProfile?.image ?? ICON_DISC)
          : (image ?? ICON_MENU),
      title,
      contentId,
    }),
  ) ?? [],
);
const selectedView = $derived.by(() => {
  const navigation = catalogNavigation;
  if (!navigation) return '';
  return (
    navigation.items.find((item) =>
      isSectionItemSelected(item, navigation.value),
    )?.id ?? ''
  );
});

function updateNavigation(navigation: SectionNavigation | undefined) {
  catalogNavigation = navigation;
  onNavigationChange?.(navigation);
}

function selectView(id: string) {
  const item = catalogNavigation?.items.find((item) => item.id === id);
  catalogNavigation?.select(item?.onSortChange ? id : (item?.sortValue ?? id));
}

let bandAbout = $derived(
  about ?? treeData?.items.find((item) => item.aboutProfile),
);
let catalog = $derived.by(() => {
  const roots = treeData?.items.filter((item) => !item.aboutProfile) ?? [];
  const releases = roots.find((item) => item.label === 'Releases');
  const hasReleases =
    (releases?.childrenCount ?? releases?.children?.length ?? 0) > 0;
  const emptyReleases: TreeItem = {
    label: 'Releases',
    image: releases?.image ?? ICON_DISC,
    path: releases?.path ?? 'band-releases',
    layout: TREE_ITEM_LAYOUT.TREE,
    showChildrenCount: false,
    children: [
      {
        label: loading
          ? 'Loading saved releases…'
          : error
            ? 'Could not read saved releases.'
            : 'No saved releases yet. Open the band’s Bandcamp page to explore its catalog.',
      },
    ],
  };
  return new TreeData(
    [
      ...(bandAbout
        ? [
            {
              ...bandAbout,
              image: bandAbout.image ?? ICON_INFO,
              path: 'band-about',
              showChildrenCount: false,
            },
          ]
        : []),
      ...roots.map((item) =>
        item === releases && !hasReleases ? emptyReleases : item,
      ),
      ...(!releases ? [emptyReleases] : []),
    ],
    treeData?.layout,
  );
});
</script>

{#snippet aboutContent(item: TreeItem)}
  <BcxBandDetails about={item} {fallbackLocation} {bandUrl} {loading} {error} />
{/snippet}

<div class="band-panel">
  {#if leadingActions || trailingActions}
    <div class="band-actions">
      {@render leadingActions?.()}
      {#if trailingActions}<div class="band-trailing-actions">{@render trailingActions()}</div>{/if}
    </div>
  {/if}
  <div bind:this={content} class="band-content" class:vertical-navigation={verticalNavigation}>
    {#if viewActions.length}
      <BcxSectionTabs tabs={viewActions} value={selectedView} label="Band catalog sections" onValueChange={selectView} compactWhenOverflowing={true} hideCountsWhenOverflowing={true} vertical={verticalNavigation} />
    {/if}
    <div class="band-catalog">
      <BcxRootSectionTabs treeData={catalog} label="Band catalog sections" {initialSelectedHref} {aboutContent} sortInToolbar={true} countBadges={true} {navigationInFilter} showFilterNavigation={!navigationInFilter} onNavigationChange={updateNavigation} />
    </div>
  </div>
</div>

<style>
.band-panel, .band-content, .band-catalog { display: flex; flex: 1 1 0%; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.band-content.vertical-navigation { flex-direction: row; }
.vertical-navigation > :global(.bcx-section-tabs) { margin-left: var(--bcx-preview-gutter, 16px); margin-right: var(--bcx-preview-column-gap, 12px); }
.band-actions { display: flex; align-items: flex-start; flex-shrink: 0; padding: 4px var(--bcx-preview-gutter, 16px); }
.band-trailing-actions { display: flex; flex-shrink: 0; margin-left: auto; }
</style>
