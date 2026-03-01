import { Album } from 'src/bandcamp/domain/album/album';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { Band } from 'src/bandcamp/domain/band/band';
import { Url } from 'src/core/url';
import { arrayUnique } from 'src/utils/array';
import type { TreeItem } from './TreeItem';

export class TreeItemFactory {
  static fromBand(band: Band): TreeItem {
    return {
      label: band.name,
      image: band.artwork.tinySizeUrl,
      href: band.url?.toString(),
    };
  }

  static fromAlbum(album: Album): TreeItem {
    return {
      label: album.toString(),
      href: album.url.toString(),
      image: album.artwork.tinySizeUrl,
      keywords: album.artist.names,
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

  static fromAlbumsByArtistNames(
    albums: Album[],
    label: string = 'Artist/Releases',
  ): TreeItem {
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
    return {
      label: item.title || item.url || 'No Title',
      href: Url.fromHistoryItem(item)?.toString(),
    };
  }
}
