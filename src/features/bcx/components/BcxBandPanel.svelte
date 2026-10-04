<script lang="ts">
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import type { ItemPreviewSizeStore } from '../stores/itemPreviewSize';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxPreviewActions from './BcxPreviewActions.svelte';
import BcxPreviewLink from './BcxPreviewLink.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import { createItemUrl } from './itemUrl';

let {
  treeData,
  about,
  fallbackLocation,
  bandUrl,
  initialSelectedHref,
  previewSize,
  loading = false,
  error = '',
}: {
  treeData?: TreeData;
  about?: TreeItem;
  fallbackLocation?: string;
  bandUrl?: string;
  initialSelectedHref?: string;
  previewSize?: ItemPreviewSizeStore;
  loading?: boolean;
  error?: string;
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
    <BcxPreviewLink url={previewUrl} name="Bandcamp" toolbar={true} title={`Open band page on Bandcamp: ${bandAbout?.aboutProfile?.name ?? 'Band'}`} />
    <BcxPreviewActions label="Copy band URL" items={[{ label: 'Copy Bandcamp URL', value: previewUrl.toString() }]} />
  {/if}
{/snippet}

<BcxRootSectionTabs {previewSize} treeData={catalog} label="Band catalog sections" {initialSelectedHref} {aboutContent} actions={previewUrl ? bandActions : undefined} />
