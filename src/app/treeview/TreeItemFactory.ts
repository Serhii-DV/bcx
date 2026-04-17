import { Band } from 'src/bandcamp/domain/band/band';
import type { Track } from 'src/bandcamp/domain/track/track';
import { Url } from 'src/core/url';
import { TreeItemButtonFactory } from './buttons/factory';
import type { TreeItem } from './TreeItem';
import type { TreeItemButton } from './TreeItemButton';
import { ICON_EXTERNAL_LINK, ICON_SQUARE_ARROW_RIGHT } from './utils/icon';

export class TreeItemFactory {
  static text(label: string): TreeItem {
    return {
      label,
    };
  }

  static textWithQuery(label: string, query?: string | number): TreeItem {
    return {
      label,
      query: typeof query === 'string' ? query : label,
      includeInFilterSuggestions: true,
      icon: ICON_SQUARE_ARROW_RIGHT,
    };
  }

  static items(label: string, children: TreeItem[]): TreeItem {
    return {
      label,
      open: false,
      children,
    };
  }

  static list(label: string, strings: string[]): TreeItem {
    return TreeItemFactory.items(label, strings.map(TreeItemFactory.text));
  }

  static link(
    label: string,
    href: string,
    icon: string = ICON_EXTERNAL_LINK,
    includeInFilterSuggestions: boolean = true,
  ): TreeItem {
    return {
      label,
      href,
      icon,
      includeInFilterSuggestions,
    };
  }

  static linkOrText(label: string, href?: string): TreeItem {
    return href
      ? TreeItemFactory.link(label, href)
      : {
          ...TreeItemFactory.text(label),
          includeInFilterSuggestions: true,
        };
  }

  static lazy(
    item: TreeItem,
    loadItem: () => Promise<TreeItem | null>,
  ): TreeItem {
    return {
      ...item,
      children: undefined,
      childrenLoaded: false,
      hasChildren: true,
      loadChildren: loadItem,
    };
  }

  static fromBand(band: Band): TreeItem {
    const href = band.url?.toString();
    const item = TreeItemFactory.link(band.name, href || '');
    item.image = band.artwork.tinySizeUrl;
    return item;
  }

  static fromArtistName(artistName: string): TreeItem {
    return {
      ...TreeItemFactory.text(artistName),
      includeInFilterSuggestions: true,
    };
  }

  static fromDate(date: Date): TreeItem {
    const label = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return TreeItemFactory.text(label);
  }

  static fromTrack(track: Track): TreeItem {
    return TreeItemFactory.linkOrText(
      track.toAlbumTrackString(),
      track.url?.toString(),
    );
  }

  static fromTracks(tracks: Track[]): TreeItem[] {
    return tracks.map(TreeItemFactory.fromTrack);
  }

  static fromHistoryItem(item: chrome.history.HistoryItem): TreeItem {
    const href = Url.fromHistoryItem(item)?.toString();
    const buttons = createExternalLinkButtons(href);

    return {
      label: item.title || item.url || 'No Title',
      href,
      buttons,
      includeInFilterSuggestions: false,
    };
  }
}

function createExternalLinkButtons(href?: string): TreeItemButton[] {
  const buttons: TreeItemButton[] = [];
  if (href) {
    buttons.push(
      TreeItemButtonFactory.createExternalLink('Open\n' + href, href),
    );
  }
  return buttons;
}
