import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
  isBandcampTrackUrl,
} from 'src/bandcamp/domain/url/helper';
import { Url } from 'src/core/url';
import { TreeItemButtonFactory } from '../buttons/factory';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';

export class HistoryEntryTreeItemFactory {
  static create(item: chrome.history.HistoryItem): TreeItem {
    const url = Url.fromHistoryItem(item);
    const href = url?.toString();
    const title = item.title || item.url || 'No Title';

    return this.withVisitTime(
      {
        label: title,
        ...(url && isBandcampMusicUrl(url)
          ? {
              bandPreview: { name: title, url: url.toString(), cached: false },
            }
          : {}),
        ...(url && (isBandcampAlbumUrl(url) || isBandcampTrackUrl(url))
          ? {
              previewInformation: {
                title,
                artist: url.subdomain,
                artistUrl: `https://${url.hostname}/`,
                releaseType: isBandcampTrackUrl(url) ? 'Track' : 'Album',
                collectionStatus: [],
                tags: [],
                tracks: [],
                description:
                  'No saved release details yet. Open the Bandcamp page to explore this release.',
              },
            }
          : {}),
        href,
        buttons: this.createExternalLinkButtons(href),
        includeInFilterSuggestions: false,
      },
      item,
    );
  }

  static withVisitTime(
    treeItem: TreeItem,
    historyItem: chrome.history.HistoryItem,
  ): TreeItem {
    if (
      typeof historyItem.lastVisitTime !== 'number' ||
      !Number.isFinite(historyItem.lastVisitTime)
    ) {
      return treeItem;
    }

    const visitDate = new Date(historyItem.lastVisitTime);
    if (Number.isNaN(visitDate.getTime())) {
      return treeItem;
    }

    return {
      ...treeItem,
      timestamp: {
        label: 'Visited',
        dateTime: visitDate.toISOString(),
      },
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
