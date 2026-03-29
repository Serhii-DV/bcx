import { Album } from 'src/bandcamp/domain/album/album';
import { Band } from 'src/bandcamp/domain/band/band';
import type { Track } from 'src/bandcamp/domain/track/track';
import { Url } from 'src/core/url';
import { TreeItemButtonFactory } from './buttons/factory';
import type { TreeItem } from './TreeItem';
import type { TreeItemButton } from './TreeItemButton';

export class TreeItemFactory {
  static text(label: string): TreeItem {
    return {
      label,
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
    return this.items(label, strings.map(this.text));
  }

  static createLink(label: string, href: string): TreeItem {
    const buttons = createExternalLinkButtons(href);

    return {
      label,
      href,
      buttons,
    };
  }

  static fromBand(band: Band): TreeItem {
    const href = band.url?.toString();
    const buttons = createExternalLinkButtons(href);

    return {
      label: band.name,
      image: band.artwork.tinySizeUrl,
      href,
      buttons,
    };
  }

  static fromAlbum(album: Album): TreeItem {
    const href = album.url?.toString();
    const buttons = createExternalLinkButtons(href);

    return {
      label: album.toString(),
      image: album.artwork.tinySizeUrl,
      keywords: album.artistNames,
      href,
      buttons,
    };
  }

  static fromArtistName(artistName: string): TreeItem {
    return {
      label: artistName,
    };
  }

  static fromDate(date: Date): TreeItem {
    const label = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return {
      label,
    };
  }

  static fromTrack(track: Track): TreeItem {
    return {
      label: track.toAlbumTrackString(),
      href: track.url?.toString(),
    };
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
