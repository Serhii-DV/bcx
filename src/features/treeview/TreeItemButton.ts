export interface TreeItemButton {
  title: string;
  icon: any; // Svelte component constructor (lucide icons, custom components, etc.)
  href?: string;
  onClick?: (element: HTMLElement) => void;
}
