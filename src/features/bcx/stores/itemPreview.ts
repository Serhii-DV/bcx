import type { TreeItem } from 'src/features/treeview/TreeItem';
import { getContext } from 'svelte';

export const ITEM_PREVIEW_CONTEXT = Symbol('item-preview');

export interface ItemPreviewContext {
  select?: (item: TreeItem) => void;
  show: (item: TreeItem) => void;
}

export function getItemPreviewContext(): ItemPreviewContext | undefined {
  return getContext<ItemPreviewContext | undefined>(ITEM_PREVIEW_CONTEXT);
}
