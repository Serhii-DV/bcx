<script lang="ts">
import {
  getReleaseArtistNames,
  type ReleaseInformation,
} from 'src/features/treeview/ReleasePreview';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import BcxPreviewItemActions from './BcxPreviewItemActions.svelte';
import { createItemUrl } from './itemUrl';
import { getReleaseFilterOptions } from './releaseFilter';

let {
  item,
  information,
  keepInPreview = false,
  iconOnly = false,
  toolbar = false,
  variant = 'menu',
  relatedActions,
  onFilter,
}: {
  item: TreeItem;
  information: ReleaseInformation;
  keepInPreview?: boolean;
  iconOnly?: boolean;
  toolbar?: boolean;
  variant?: 'menu' | 'toolbar';
  relatedActions?: Snippet;
  onFilter?: (query: string) => void;
} = $props();
let name = $derived(`${information.artist} - ${information.title}`);
let releaseYear = $derived(
  information.releaseYear ??
    (information.date
      ? new Date(information.date).getUTCFullYear()
      : undefined),
);
</script>

<BcxPreviewItemActions url={createItemUrl(item.href ?? item.id)} image={item.previewImage} {name} kind="release" copyValue={name} releaseArtist={information.artist} releaseDate={information.date} releaseTitle={information.title} {releaseYear} previewItem={item} {keepInPreview} {iconOnly} {toolbar} {variant} {relatedActions} filterOptions={onFilter ? [...getReleaseArtistNames(information).map((artist) => ({ label: `Artist: ${artist}`, query: artist })), ...getReleaseFilterOptions(information, item.price)] : []} {onFilter} />
