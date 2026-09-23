import type { BandPreview } from './BandPreview';
import type { ReleaseCatalog } from './items/releaseCatalog';
import type { ReleaseInformation, ReleasePreview } from './ReleasePreview';
import type { TreeItemButton } from './TreeItemButton';

export interface TreeItemClickContext {
  element: HTMLElement;
  item: TreeItem;
  parent?: TreeItem | null;
  findItemByPath?: (path?: string | null) => TreeItem | null;
  findParentByPath?: (path?: string | null) => TreeItem | null;
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

export interface TreeItemFilterSearchResult {
  items: TreeItem[];
  total: number;
}

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
  pathKey?: string;
  href?: string;
  image?: string; // image URL or icon name
  flagCode?: string;
  aboutProfile?: {
    name: string;
    image?: string;
    location?: string;
    following?: boolean;
  };
  hint?: string;
  query?: string;
  keywords?: string[];
  includeInFilterSuggestions?: boolean;
  layout?: TreeItemLayout;
  buttons?: TreeItemButton[];
  onClick?: (context: TreeItemClickContext) => void | Promise<void>;
  loadChildren?: (
    onUpdate?: (value: TreeItem[] | TreeItem | null) => void,
  ) => Promise<TreeItem[] | TreeItem | null>;
  filterSearch?: (query: string) => Promise<TreeItemFilterSearchResult>;
  releaseCatalog?: ReleaseCatalog;
  releasePreview?: boolean;
  itemPreview?: boolean;
  bandPreview?: BandPreview;
  previewImage?: string;
  previewInformation?: ReleaseInformation;
  initialSelectedHref?: string;
  loadPreview?: () => Promise<ReleasePreview>;
  actionIcon?: string; // action icon name
  timestamp?: {
    label: string;
    dateTime: string;
  };
  secondaryTimestamp?: TreeItem['timestamp'];
}

export function hasItemPreview(item?: TreeItem | null): boolean {
  return !!(item?.loadPreview || item?.previewInformation || item?.bandPreview);
}
