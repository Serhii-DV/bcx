<script lang="ts">
import type { ReleaseInformation } from 'src/features/treeview/ReleasePreview';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import { createItemUrl } from './itemUrl';

let {
  item,
  information,
  keepInPreview = false,
  iconOnly = false,
  toolbar = false,
}: {
  item: TreeItem;
  information: ReleaseInformation;
  keepInPreview?: boolean;
  iconOnly?: boolean;
  toolbar?: boolean;
} = $props();
let name = $derived(`${information.artist} - ${information.title}`);
</script>

<BcxPreviewItemActions url={createItemUrl(item.href ?? item.id)} image={item.previewImage} {name} kind="release" copyValue={name} releaseTitle={information.title} previewItem={item} {keepInPreview} {iconOnly} {toolbar} />
