<script lang="ts">
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import { createItemUrl } from './itemUrl';
import type { SectionNavigation } from './sectionNavigation';

let {
  treeData,
  about,
  fallbackLocation,
  bandUrl,
  initialSelectedHref,
  loading = false,
  error = '',
  onNavigationChange,
}: {
  treeData?: TreeData;
  about?: TreeItem;
  fallbackLocation?: string;
  bandUrl?: string;
  initialSelectedHref?: string;
  loading?: boolean;
  error?: string;
  onNavigationChange?: (navigation: SectionNavigation | undefined) => void;
} = $props();
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
{/snippet}

<div class="band-panel">
  {#if previewUrl}
    <BcxSectionTabs tabs={[]} value="" label="Band actions" actions={bandActions} wrapActions={true} />
  {/if}
  <div class="band-catalog">
    <BcxRootSectionTabs treeData={catalog} label="Band catalog sections" {initialSelectedHref} {aboutContent} responsiveSidebar={true} {onNavigationChange} />
  </div>
</div>

<style>
.band-panel, .band-catalog { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
</style>
