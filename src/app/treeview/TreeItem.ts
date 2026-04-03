import type { TreeItemButton } from './TreeItemButton';

export interface TreeItem {
  id?: string;
  label?: string;
  children?: TreeItem[];
  open?: boolean;
  level?: number;
  path?: string;
  href?: string;
  image?: string;
  query?: string;
  keywords?: string[];
  buttons?: TreeItemButton[];
  onClick?: (element: HTMLElement) => void;
  icon?: any; // Svelte component constructor (lucide icons, custom components, etc.)
}
