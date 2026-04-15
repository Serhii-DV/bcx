import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import type { Url } from 'src/core/url';
import { console } from 'src/utils/console';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TreeData } from '../TreeData';
import type { TreeItem } from '../TreeItem';
import { BandTreeItem } from './BandTreeItem';
import { CollectionTreeItem } from './collection/CollectionTreeItem';
import { FanPageDataTreeItem } from './FanPageDataTreeItem';
import { FollowingBandsTreeItem } from './FollowingBandsTreeItem';
import { FollowingGenresTreeItem } from './FollowingGenresTreeItem';
import { HistoryTreeItem } from './HistoryTreeItem';
import { TreeItemCache } from './TreeItemCache';
import { WishlistTreeItem } from './WishlistTreeItem';

const CACHE_TTL = {
  RELEASE: 24 * 60 * 60 * 1000,
  BAND: 24 * 60 * 60 * 1000,
  FOLLOWING_BANDS: 60 * 60 * 1000,
  FOLLOWING_GENRES: 60 * 60 * 1000,
  COLLECTION: 30 * 60 * 1000,
  WISHLIST: 30 * 60 * 1000,
  HISTORY: 10 * 60 * 1000,
} as const;

export class MainTreeData {
  static async create(
    url: Url,
    band: Band | null,
    album: Album | null,
  ): Promise<TreeData> {
    const logLabel = `[MainTreeData.create]`;
    console.log(logLabel, { url, band, album });
    console.time(logLabel);

    const treeData = new TreeData();
    const userKeyPart =
      bandcampPageData?.fanData?.username ||
      bandcampPageData?.fanData?.fan_id ||
      'anonymous';
    const items: Array<Promise<TreeItem | null>> = [];

    if (album) {
      items.push(
        TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('release', album.id),
          () => AlbumTreeItemFactory.createWithInformation(album),
          CACHE_TTL.RELEASE,
        ),
      );
    }

    if (band) {
      items.push(
        TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('band', band.id),
          async () => BandTreeItem.create(band, url),
          CACHE_TTL.BAND,
        ),
      );
    }

    if (bandcampPageData) {
      const fanData = bandcampPageData.fanData;

      if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
        items.push(FanPageDataTreeItem.create(bandcampPageData));
      }

      items.push(
        TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey(userKeyPart, 'following-bands'),
          () => FollowingBandsTreeItem.create(fanData.username || ''),
          CACHE_TTL.FOLLOWING_BANDS,
        ),
      );
      items.push(
        TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey(userKeyPart, 'following-genres'),
          () => FollowingGenresTreeItem.create(fanData.username || ''),
          CACHE_TTL.FOLLOWING_GENRES,
        ),
      );
      items.push(
        TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey(userKeyPart, 'collection'),
          () => CollectionTreeItem.create(fanData.username || ''),
          CACHE_TTL.COLLECTION,
        ),
      );
      items.push(
        TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey(userKeyPart, 'wishlist'),
          () => WishlistTreeItem.create(fanData.username || ''),
          CACHE_TTL.WISHLIST,
        ),
      );
    }

    items.push(
      TreeItemCache.getOrCreate(
        TreeItemCache.subtreeKey(userKeyPart, 'history'),
        () => HistoryTreeItem.create(),
        CACHE_TTL.HISTORY,
      ),
    );

    const createdItems = await Promise.all(items);

    createdItems.forEach((item) => {
      if (item) {
        treeData.add(item);
      }
    });

    console.timeEnd(logLabel);

    return treeData;
  }
}
