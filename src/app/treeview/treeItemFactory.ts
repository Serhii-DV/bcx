import { Album } from 'src/bandcamp/domain/album/album';
import { Band } from 'src/bandcamp/domain/band/band';
import { createQueryCountString } from 'src/bandcamp/domain/page/helper';
import type {
  BandcampPageData,
  UserData,
} from 'src/bandcamp/domain/pageData/pageData';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import {
  isBandcampRegularUrl,
  isBandcampUrl,
} from 'src/bandcamp/domain/url/helper';
import { History } from 'src/core/history';
import { Url } from 'src/core/url';
import { createQueryCountMap } from 'src/utils/array';
import { hasOwnProperty } from 'src/utils/utils';
import type { QueryCountMap } from '$lib/components/bcx';
import { Wishlist } from '../wishlist/Wishlist';
import type { TreeItem } from './treeItem';

export class TreeItemFactory {
  static fromBand(band: Band, withChildren: boolean = true): TreeItem {
    const queryCountMap = createQueryCountMap(band.metadata.queries);
    const children: TreeItem[] = [];

    if (withChildren) {
      children.push({
        label: createQueryCountString(
          'Artist/Releases',
          band.metadata.artistNames.length,
        ),
        open: false,
        children: createBandArtistsReleasesTreeItems(band, queryCountMap),
      });

      children.push(createBandYearsTreeItem(band, queryCountMap));
      children.push(createBandKeywordsTreeItem(band, queryCountMap));
    }

    return {
      label: band.name,
      image: band.artwork.tinySizeUrl,
      open: withChildren,
      href: !withChildren ? band.url.toString() : undefined,
      children,
    };
  }

  static fromAlbum(album: Album): TreeItem {
    return {
      label: album.toString(),
      query: album.toString(),
      href: album.url.toString(),
      image: album.artwork.tinySizeUrl,
    };
  }

  static fromHistoryItem(item: chrome.history.HistoryItem): TreeItem {
    return {
      label: item.title || item.url || 'No Title',
      href: Url.fromHistoryItem(item)?.toString(),
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

  static async fromHistory(): Promise<TreeItem> {
    try {
      const historyItems = await History.search({
        text: 'bandcamp.com',
        maxResults: 1000,
        startTime: 0,
      });
      const children: TreeItem[] = [];
      const uuids = new Set<string>();

      historyItems.forEach((item) => {
        let url = Url.fromHistoryItem(item);

        if (!url || !isBandcampUrl(url) || isBandcampRegularUrl(url)) {
          return;
        }

        url = BandcampUrlFactory.create(url);
        const uuid = url.uuid;

        if (uuids.has(uuid)) {
          return;
        }

        uuids.add(uuid);
      });

      const bandsAndAlbums: (Band | Album)[] = await BandcampStorage.getByUuids(
        Array.from(uuids),
      );
      const uuidTreeItemsMap = new Map<string, TreeItem>();

      bandsAndAlbums.forEach((entity) => {
        const treeItem =
          entity instanceof Band
            ? TreeItemFactory.fromBand(entity, false)
            : TreeItemFactory.fromAlbum(entity);

        uuidTreeItemsMap.set(entity.url.uuid!, treeItem);
      });

      historyItems.forEach((item) => {
        const url = Url.fromHistoryItem(item);
        if (!url) {
          return;
        }
        const uuid = url.uuid;
        if (!uuids.has(uuid)) {
          return;
        }
        const historyItem =
          uuidTreeItemsMap.get(uuid) || TreeItemFactory.fromHistoryItem(item);
        const dateItem = TreeItemFactory.fromDate(
          new Date(item.lastVisitTime as number),
        );
        const childrenDateItem = children.find(
          (child) => child.label === dateItem.label,
        );

        if (childrenDateItem) {
          childrenDateItem.children = childrenDateItem.children || [];
          const childrenHistoryItem = childrenDateItem.children.find(
            (child) => child.label === historyItem.label,
          );

          if (childrenHistoryItem) {
            return;
          }

          childrenDateItem.children!.push(historyItem);
        } else {
          children.push({
            ...dateItem,
            children: [historyItem],
          });
        }
      });

      updateChildrenCounts(children);

      return {
        label: createQueryCountString(`History`, children.length),
        children,
      };
    } catch (error) {
      console.error(
        '[TreeItemFactory.fromHistory]',
        'Failed to load history:',
        error,
      );
      return {
        label: 'History (error)',
      };
    }
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

    children.push(await Wishlist.createWishlistTreeItems(fan_data.username));
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

    updateChildrenCounts(children);

    return {
      label: `Fan: ${fan_data.name} (${fan_data.location})`,
      children,
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

    children.push(await Wishlist.createWishlistTreeItems(userData.username));

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
      const treeItem = TreeItemFactory.fromBand(band, false);
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

function createBandArtistsReleasesTreeItems(
  band: Band,
  queryCountMap: QueryCountMap,
): TreeItem[] {
  const children = band.metadata.artistNames.map((artist) => {
    const count = queryCountMap.get(artist) || 0;
    const label = createQueryCountString(artist, count);
    const artistChildren: TreeItem[] = band.metadata.albums
      .filter((album) => album.artist.names.includes(artist))
      .map(TreeItemFactory.fromAlbum);

    return {
      label,
      query: artist,
      open: false,
      children: artistChildren,
    } as TreeItem;
  });

  return children;
}

function createBandYearsTreeItem(
  band: Band,
  queryCountMap: QueryCountMap,
): TreeItem {
  const children: TreeItem[] = band.metadata.years.map((year) => {
    const query = year.toString();
    const count = queryCountMap.get(query) || 0;
    const label = createQueryCountString(query, count);
    const children: TreeItem[] = band.metadata
      .albumsByYear(year)
      .map(TreeItemFactory.fromAlbum);

    return {
      label,
      query,
      children,
    };
  });

  return {
    label: createQueryCountString('Years', band.metadata.years.length),
    open: false,
    children,
  };
}

function createBandKeywordsTreeItem(
  band: Band,
  queryCountMap: QueryCountMap,
): TreeItem {
  const children: TreeItem[] = band.metadata.keywords.map((keyword) => {
    const count = queryCountMap.get(keyword) || 0;
    const label = createQueryCountString(keyword, count);

    return {
      label,
      query: keyword,
    };
  });

  return {
    label: createQueryCountString('Keywords', band.metadata.keywords.length),
    open: false,
    children,
  };
}

function updateChildrenCounts(treeItems: TreeItem[]): void {
  // Update labels with counts
  treeItems.forEach((child) => {
    if (child.children) {
      child.label = createQueryCountString(child.label, child.children.length);
    }
  });
}
