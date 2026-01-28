export interface TreeItem {
  id?: string;
  label: string;
  children?: TreeItem[];
  open?: boolean;
  level?: number;
  path?: string;
}
