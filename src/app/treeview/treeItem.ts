export interface TreeItem {
  id?: string;
  label: string;
  children?: TreeItem[];
  open?: boolean;
  level?: number;
  path?: string;
  href?: string;
  image?: string;
  query?: string;
  keywords?: string[];
  onClick?: (element: HTMLElement) => void;
}
