<script lang="ts">
import type { ReleaseInformation } from 'src/features/treeview/ReleasePreview';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import { createItemUrl } from './itemUrl';

let {
  item,
  information,
  keepInPreview = false,
  iconOnly = false,
  toolbar = false,
  variant = 'menu',
  relatedActions,
}: {
  item: TreeItem;
  information: ReleaseInformation;
  keepInPreview?: boolean;
  iconOnly?: boolean;
  toolbar?: boolean;
  variant?: 'menu' | 'toolbar';
  relatedActions?: Snippet;
} = $props();
let name = $derived(`${information.artist} - ${information.title}`);
</script>

<BcxPreviewItemActions url={createItemUrl(item.href ?? item.id)} image={item.previewImage} {name} kind="release" copyValue={name} releaseTitle={information.title} previewItem={item} {keepInPreview} {iconOnly} {toolbar} {variant} {relatedActions} />
