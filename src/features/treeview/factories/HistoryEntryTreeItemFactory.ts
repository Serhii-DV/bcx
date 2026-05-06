import { Url } from 'src/core/url';
import { TreeItemButtonFactory } from '../buttons/factory';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';

export class HistoryEntryTreeItemFactory {
  static create(item: chrome.history.HistoryItem): TreeItem {
    const href = Url.fromHistoryItem(item)?.toString();

    return {
      label: item.title || item.url || 'No Title',
      href,
      buttons: this.createExternalLinkButtons(href),
      includeInFilterSuggestions: false,
    };
  }

  private static createExternalLinkButtons(href?: string): TreeItemButton[] {
    const buttons: TreeItemButton[] = [];

    if (href) {
      buttons.push(
        TreeItemButtonFactory.createExternalLink('Open\n' + href, href),
      );
    }

    return buttons;
  }
}
