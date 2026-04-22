import { ExternalLink, RefreshCcw } from '@lucide/svelte';
import type { TreeItemButton } from '../TreeItemButton';

export class TreeItemButtonFactory {
  static createExternalLink(title: string, href: string): TreeItemButton {
    return {
      title,
      icon: ExternalLink,
      href,
    };
  }

  static createRefreshButton(
    title: string,
    onClick: (element: HTMLElement) => void,
  ): TreeItemButton {
    return {
      title,
      icon: RefreshCcw,
      onClick,
    };
  }
}
