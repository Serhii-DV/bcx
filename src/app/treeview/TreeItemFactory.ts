import { Album } from 'src/bandcamp/domain/album/album';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { Band } from 'src/bandcamp/domain/band/band';
import { Url } from 'src/core/url';
import { arrayUnique } from 'src/utils/array';
import type { TreeItem } from './TreeItem';
import type { TreeItemButton } from './TreeItemButton';
import { TreeItemButtonFactory } from './buttons/factory';
import { setTreeItemsQueryFromLabel } from './utils';
import type { Track } from 'src/bandcamp/domain/track/track';
import type { Artist } from 'src/bandcamp/domain/artist/artist';

export class TreeItemFactory {
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
      keywords: album.artist.names,
      href,
      buttons,
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

  static fromArtist(artist: Artist): TreeItem[] {
    return artist.names.map((name) => {
      return {
        label: name
      }
    });
  }

  static fromTrack(track: Track): TreeItem {
    const children: TreeItem[] = [];

    children.push({
      label: 'Artists',
      children: TreeItemFactory.fromArtist(track.artist)
    });
    children.push({
      label: 'Title',
      children: [{
        label: track.title
      }]
    });

    if (track.time) {
      children.push({
        label: 'Time',
        children: [{
          label: track.time.toReadableString()
        }]
      });
    }

    return {
      label: track.toAlbumTrackString(),
      href: track.url?.toString(),
      children
    }
  }

  static fromTracks(tracks: Track[]): TreeItem[] {
    return tracks.map(TreeItemFactory.fromTrack);
  }

  static createTreeItemsFromAlbumsByArtistReleases(albums: Album[]): TreeItem[] {
    const artistNames = getArtistNamesFromAlbums(albums);
    return arrayUnique(artistNames)
      .sort()
      .map((artist) => {
        const artistChildren: TreeItem[] = albums
          .filter((album) => album.artist.names.includes(artist))
          .map(TreeItemFactory.fromAlbum);

        return {
          label: artist,
          open: false,
          children: artistChildren,
        } as TreeItem;
      });
  }

  static createAlbumsTreeItem(
    albums: Album[],
    label: string = 'Artist/Releases',
  ): TreeItem {
    const children = this.createTreeItemsFromAlbumsByArtistReleases(albums);

    return {
      label,
      open: false,
      children,
    };
  }

  static createBandYearsTreeItem(band: Band, label: string = 'Years'): TreeItem {
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      const children: TreeItem[] = band.metadata
        .albumsByYear(year)
        .map(TreeItemFactory.fromAlbum);

      return {
        label: year.toString(),
        children: setTreeItemsQueryFromLabel(children),
      };
    });

    return {
      label,
      open: false,
      children,
    };
  }

  static createTreeItemsAlbumsByArtistNames(albums: Album[]): TreeItem[] {
    const artistNames = getArtistNamesFromAlbums(albums);
    const children = arrayUnique(artistNames)
      .sort()
      .map((artist) => {
        const artistChildren: TreeItem[] = albums
          .filter((album) => album.artist.names.includes(artist))
          .map(TreeItemFactory.fromAlbum);

        return {
          label: artist,
          open: false,
          children: artistChildren,
        } as TreeItem;
      });

    return children;
  }

  static fromKeywords(keywords: string[], label: string = 'Tags'): TreeItem {
    const children: TreeItem[] = keywords.map((keyword) => ({
      label: keyword,
    }));

    return {
      label,
      open: false,
      children,
    };
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
      TreeItemButtonFactory.createExternalLink('Open\n'+href, href),
    );
  }
  return buttons;
}
