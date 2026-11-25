<script lang="ts">
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import { createItemUrl } from './itemUrl';

let {
  about,
  bandUrl,
  iconOnly = false,
}: {
  about: TreeItem;
  bandUrl?: string;
  iconOnly?: boolean;
} = $props();
const profile = $derived(about.aboutProfile);
const bandName = $derived(profile?.name ?? about.label ?? 'Band');
const pageUrl = $derived(createItemUrl(bandUrl ?? profile?.url));
const bandActionProps = $derived({
  url: pageUrl,
  image: profile?.image,
  name: bandName,
  kind: 'band' as const,
  copyValue: bandName,
  keepInPreview: true,
  previewItem: pageUrl
    ? {
        label: bandName,
        href: pageUrl.toString(),
        image: profile?.image,
        bandPreview: {
          id: profile?.id,
          name: bandName,
          url: pageUrl.toString(),
          image: profile?.image,
          cached: false,
        },
      }
    : undefined,
});
</script>

<BcxPreviewItemActions {...bandActionProps} variant="toolbar" toolbar={true} {iconOnly} copyLabelHashtag />
