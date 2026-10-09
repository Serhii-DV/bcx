import type { TreeItem } from 'src/features/treeview/TreeItem';
import { getContext } from 'svelte';
import { createItemUrl } from '../components/itemUrl';

export const ITEM_PREVIEW_CONTEXT = Symbol('item-preview');

export interface ItemPreviewContext {
  select?: (item: TreeItem) => void;
  show: (item: TreeItem) => void;
}

export function getItemPreviewContext(): ItemPreviewContext | undefined {
  return getContext<ItemPreviewContext | undefined>(ITEM_PREVIEW_CONTEXT);
}

export function getItemPreviewId(item: TreeItem): string {
  return (
    createItemUrl(
      item.bandPreview?.url ?? item.href ?? item.id,
    )?.withoutSearchAndHash.toString() ??
    item.id ??
    `${item.previewInformation?.artist ?? ''}:${item.previewInformation?.title ?? item.label ?? item.path ?? 'release'}`
  );
}

export function getItemPreviewLabel(item: TreeItem): string {
  if (item.bandPreview) return item.bandPreview.name;
  const information = item.previewInformation;
  const title = information?.title ?? item.label ?? 'Release';
  const year =
    information?.releaseYear ??
    (information?.date
      ? new Date(information.date).getUTCFullYear()
      : undefined);
  return `${information?.artist ? `${information.artist} - ` : ''}${title}${year && Number.isFinite(year) ? ` (${year})` : ''}`;
}
