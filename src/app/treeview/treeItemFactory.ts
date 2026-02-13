import { Album } from 'src/bandcamp/domain/album/album';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { Band } from 'src/bandcamp/domain/band/band';
import type {
  BandcampPageData,
  UserData,
} from 'src/bandcamp/domain/pageData/pageData';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { arrayUnique } from 'src/utils/array';
import { hasOwnProperty } from 'src/utils/utils';
import { BandTreeItem } from './band/BandTreeItem';
import type { TreeItem } from './treeItem';
import { updateTreeItemsCounts } from './utils';
import { WishlistTreeItem } from './wishlist/WishlistTreeItem';

export class TreeItemFactory {
  static fromAlbum(album: Album): TreeItem {
    return {
      label: album.toString(),
      query: album.toString(),
      href: album.url.toString(),
      image: album.artwork.tinySizeUrl,
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

  static fromAlbumsByArtistNames(albums: Album[]): TreeItem[] {
    const artistNames = getArtistNamesFromAlbums(albums);
    const children = arrayUnique(artistNames)
      .sort()
      .map((artist) => {
        const artistChildren: TreeItem[] = albums
          .filter((album) => album.artist.names.includes(artist))
          .map(TreeItemFactory.fromAlbum);

        return {
          label: artist,
          query: artist,
          open: false,
          children: artistChildren,
        } as TreeItem;
      });

    return children;
  }

  static async fromBandcampFanPageData(
    pageData: BandcampPageData,
  ): Promise<TreeItem | null> {
    const { fan_data } = pageData.data;

    if (!fan_data) {
      return null;
    }

    const children: TreeItem[] = [];
    children.push({
      label: 'Collection',
      href: BandcampUrlFactory.generateCollectionUrl(fan_data.username),
      children: createAlbumsTreeItemsFromItemsCache(
        pageData.data.item_cache.collection,
      ),
    });

    children.push(await WishlistTreeItem.create(fan_data.username));
    children.push({
      label: 'Following Bands',
      href: BandcampUrlFactory.generateFollowingBandsUrl(fan_data.username),
      children: createFollowingBandsTreeItems(pageData),
    });
    children.push({
      label: 'Following Genres',
      href: BandcampUrlFactory.generateFollowingGenresUrl(fan_data.username),
      children: createFollowingGenresTreeItems(pageData),
    });

    return {
      label: `Fan: ${fan_data.name} (${fan_data.location})`,
      children: updateTreeItemsCounts(children),
    };
  }

  static async createPersonalMenu(userData: UserData): Promise<TreeItem> {
    if (!userData.username) {
      return {
        label: 'You: (not logged in)',
        children: [
          {
            label: 'Login',
            href: BandcampUrlFactory.generateLoginUrl(),
          },
        ],
      };
    }

    const children: TreeItem[] = [];

    children.push({
      label: 'Feed',
      href: BandcampUrlFactory.generateFeedUrl(userData.username),
    });

    children.push({
      label: 'Collection',
      href: BandcampUrlFactory.generateCollectionUrl(userData.username),
    });

    return {
      label: `You: ${userData.name}`,
      children,
    };
  }
}

function createAlbumsTreeItemsFromItemsCache(items: any): TreeItem[] {
  const treeItems: TreeItem[] = [];
  for (const key in items) {
    if (hasOwnProperty(items, key)) {
      const item = items[key];
      const album = Album.create(
        item.item_url,
        item.band_name,
        item.item_title,
        item.album_id,
        item.item_art_id,
        item.band_id,
      );
      const treeItem = TreeItemFactory.fromAlbum(album);
      treeItems.push(treeItem);
    }
  }
  return treeItems;
}

function createFollowingBandsTreeItems(pageData: BandcampPageData): TreeItem[] {
  const treeItems: TreeItem[] = [];
  const bands = pageData.data?.item_cache?.following_bands;

  for (const key in bands) {
    if (hasOwnProperty(bands, key)) {
      const item = bands[key];
      const band = Band.create(
        item.band_id,
        item.name,
        BandcampUrlFactory.generateBandUrlFromSubdomain(
          item.url_hints.subdomain,
        ),
        item.image_id,
      );
      const treeItem = BandTreeItem.create(band, false);
      treeItems.push(treeItem);
    }
  }
  return treeItems;
}

function createFollowingGenresTreeItems(
  pageData: BandcampPageData,
): TreeItem[] {
  const treeItems: TreeItem[] = [];
  const genres = pageData.data?.item_cache?.following_genres;

  for (const key in genres) {
    if (hasOwnProperty(genres, key)) {
      const item = genres[key];
      const treeItem: TreeItem = {
        label: item.display_name,
        href: item.tag_page_url,
      };
      treeItems.push(treeItem);
    }
  }
  return treeItems;
}
