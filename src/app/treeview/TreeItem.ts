import type { TreeItemButton } from './TreeItemButton';

export interface TreeItemClickContext {
  element: HTMLElement;
  item: TreeItem;
  parent?: TreeItem | null;
  focusPath?: string;
  refreshTree?: boolean;
  showFeedback?: (message: string, duration?: number) => void;
}

export const TREE_ITEM_LAYOUT = {
  BROWSER: 'browser',
  TREE: 'tree',
} as const;

export type TreeItemLayout =
  (typeof TREE_ITEM_LAYOUT)[keyof typeof TREE_ITEM_LAYOUT];

export interface TreeItem {
  id?: string;
  label?: string;
  children?: TreeItem[];
  childrenCount?: number;
  hasChildren?: boolean;
  childrenLoaded?: boolean;
  isLoadingChildren?: boolean;
  showChildrenCount?: boolean;
  open?: boolean;
  level?: number;
  path?: string;
  href?: string;
  image?: string; // image URL or icon name
  query?: string;
  keywords?: string[];
  includeInFilterSuggestions?: boolean;
  layout?: TreeItemLayout;
  buttons?: TreeItemButton[];
  onClick?: (context: TreeItemClickContext) => void | Promise<void>;
  loadChildren?: () => Promise<TreeItem[] | TreeItem | null>;
  actionIcon?: string; // action icon name
}
