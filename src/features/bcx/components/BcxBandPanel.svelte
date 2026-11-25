<script lang="ts">
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { ICON_DISC, ICON_INFO } from 'src/features/treeview/utils/icon';
import type { Snippet } from 'svelte';
import BcxBandActions from './BcxBandActions.svelte';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxFilteredCatalog from './BcxFilteredCatalog.svelte';
import BcxPanelHeading from './BcxPanelHeading.svelte';
import { bandReleaseFilterCategories } from './catalogFilters';

let {
  treeData,
  about,
  fallbackLocation,
  bandUrl,
  initialSelectedHref,
  loading = false,
  error = '',
  navigationInFilter = false,
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
  leadingActions?: Snippet;
  trailingActions?: Snippet;
} = $props();
let panel = $state<HTMLDivElement>();
let compactActions = $state(false);

$effect(() => {
  const element = panel;
  if (!element) return;
  const measure = () => {
    compactActions = element.clientWidth < 640;
  };
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  measure();
  return () => observer.disconnect();
});

let bandAbout = $derived(
  about ?? treeData?.items.find((item) => item.aboutProfile),
);
const bandIdentity = $derived(bandUrl ?? bandAbout?.aboutProfile?.url);
const releases = $derived(
  treeData?.items.find((item) => item.label === 'Releases'),
);
const releasesPath = $derived(releases?.path ?? 'band-releases');
const hasReleases = $derived(
  (releases?.childrenCount ?? releases?.children?.length ?? 0) > 0,
);
let catalog = $derived.by(() => {
  const roots = treeData?.items.filter((item) => !item.aboutProfile) ?? [];
  const emptyReleases: TreeItem = {
    label: 'Releases',
    image: releases?.image ?? ICON_DISC,
    path: releasesPath,
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
  <BcxBandDetails about={item} {fallbackLocation} {bandUrl} {loading} {error} showActions={false} />
{/snippet}

{#snippet bandActions()}
  {#if bandAbout}<BcxBandActions about={bandAbout} {bandUrl} iconOnly={compactActions} />{/if}
{/snippet}

{#snippet panelHeading()}
  <BcxPanelHeading label={bandAbout?.aboutProfile?.name ?? 'Band'} image={bandAbout?.aboutProfile?.image ?? ICON_DISC} inline {leadingActions} {trailingActions} />
{/snippet}

<div bind:this={panel} class="band-panel">
  <BcxFilteredCatalog treeData={catalog} categories={bandReleaseFilterCategories} catalogIdentity={bandIdentity} label="Band catalog sections" defaultRootPath={releasesPath} {initialSelectedHref} {aboutContent} heading={panelHeading} navigationInToolbar {navigationInFilter} navigationActions={bandAbout ? bandActions : undefined} compactWhenOverflowing countBadges />
</div>

<style>
.band-panel { display: flex; flex: 1 1 0%; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
</style>
