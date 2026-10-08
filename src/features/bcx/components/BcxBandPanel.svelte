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
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import { createItemUrl } from './itemUrl';
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
} = $props();
let catalogNavigation = $state<SectionNavigation>();
const viewActions = $derived(
  catalogNavigation?.items.map(({ id, label, image, title, contentId }) => ({
    id,
    label,
    image: image ?? ICON_MENU,
    title,
    contentId,
  })) ?? [],
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
let previewUrl = $derived(
  createItemUrl(bandUrl ?? bandAbout?.aboutProfile?.url),
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
  <BcxBandDetails about={item} {fallbackLocation} {loading} {error} />
{/snippet}

{#snippet bandActions()}
  {#if previewUrl}
    <BcxPreviewItemActions url={previewUrl} image={bandAbout?.aboutProfile?.image} name={bandAbout?.aboutProfile?.name ?? 'Band'} kind="band" copyValue={bandAbout?.aboutProfile?.name ?? 'Band'} keepInPreviewTab={true} previewItem={{ label: bandAbout?.aboutProfile?.name, href: previewUrl.toString(), image: bandAbout?.aboutProfile?.image, bandPreview: { name: bandAbout?.aboutProfile?.name ?? 'Band', url: previewUrl.toString(), image: bandAbout?.aboutProfile?.image, cached: false } }} />
  {/if}
  {#if previewUrl && navigationInFilter && viewActions.length}
    <span class="band-actions-divider" role="separator" aria-orientation="vertical"></span>
  {/if}
{/snippet}

<div class="band-panel">
  {#if navigationInFilter}
    <BcxSectionTabs tabs={viewActions} value={selectedView} label="Band catalog sections" leadingActions={bandActions} onValueChange={selectView} compactWhenOverflowing={true} />
  {:else if previewUrl}
    <BcxSectionTabs tabs={[]} value="" label="Band actions" actions={bandActions} wrapActions={true} />
  {/if}
  <div class="band-catalog">
    <BcxRootSectionTabs treeData={catalog} label="Band catalog sections" {initialSelectedHref} {aboutContent} responsiveSidebar={true} sortInToolbar={true} {navigationInFilter} showFilterNavigation={!navigationInFilter} onNavigationChange={navigationInFilter ? updateNavigation : onNavigationChange} />
  </div>
</div>

<style>
.band-panel, .band-catalog { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
.band-actions-divider { flex: 0 0 1px; width: 1px; height: 24px; background: #4b5563; }
</style>
