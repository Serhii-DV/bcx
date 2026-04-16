import type { TreeItemButton } from './TreeItemButton';

export interface TreeItemClickContext {
  element: HTMLElement;
  item: TreeItem;
  parent?: TreeItem | null;
}

export interface TreeItem {
  id?: string;
  label?: string;
  children?: TreeItem[];
  hasChildren?: boolean;
  childrenLoaded?: boolean;
  isLoadingChildren?: boolean;
  showChildrenCount?: boolean;
  open?: boolean;
  level?: number;
  path?: string;
  href?: string;
  image?: string;
  query?: string;
  keywords?: string[];
  includeInFilterSuggestions?: boolean;
  buttons?: TreeItemButton[];
  onClick?: (context: TreeItemClickContext) => void | Promise<void>;
  loadChildren?: () => Promise<TreeItem[] | TreeItem | null>;
  icon?: string; // icon name
}
