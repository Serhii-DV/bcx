import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import type { Url } from 'src/core/url';
import { console } from 'src/utils/console';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TreeData } from '../TreeData';
import { BandTreeItem } from './BandTreeItem';
import { CollectionTreeItem } from './CollectionTreeItem';
import { FanPageDataTreeItem } from './FanPageDataTreeItem';
import { FollowingBandsTreeItem } from './FollowingBandsTreeItem';
import { FollowingGenresTreeItem } from './FollowingGenresTreeItem';
import { HistoryTreeItem } from './HistoryTreeItem';
import { WishlistTreeItem } from './WishlistTreeItem';
import { TreeItemCache } from './TreeItemCache';

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

    if (album) {
      const releaseTreeItem = await TreeItemCache.getOrCreate(
        TreeItemCache.subtreeKey('release', album.id, url.uuid),
        () => AlbumTreeItemFactory.createWithInformation(album),
        CACHE_TTL.RELEASE,
      );
      treeData.add(releaseTreeItem);
    }

    if (band) {
      const bandTreeItem = await TreeItemCache.getOrCreate(
        TreeItemCache.subtreeKey('band', band.id, url.uuid),
        async () => BandTreeItem.create(band, url),
        CACHE_TTL.BAND,
      );
      treeData.add(bandTreeItem);
    }

    if (bandcampPageData) {
      const fanData = bandcampPageData.fanData;

      if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
        const fanPageDataTreeItem =
          await FanPageDataTreeItem.create(bandcampPageData);
        if (fanPageDataTreeItem) {
          treeData.add(fanPageDataTreeItem);
        }
      }

      treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('following-bands', userKeyPart),
          () => FollowingBandsTreeItem.create(fanData.username || ''),
          CACHE_TTL.FOLLOWING_BANDS,
        ),
      );
      treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('following-genres', userKeyPart),
          () => FollowingGenresTreeItem.create(fanData.username || ''),
          CACHE_TTL.FOLLOWING_GENRES,
        ),
      );
      treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('collection', userKeyPart),
          () => CollectionTreeItem.create(fanData.username || ''),
          CACHE_TTL.COLLECTION,
        ),
      );
      treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('wishlist', userKeyPart),
          () => WishlistTreeItem.create(fanData.username || ''),
          CACHE_TTL.WISHLIST,
        ),
      );
    }

    treeData.add(
      await TreeItemCache.getOrCreate(
        TreeItemCache.subtreeKey('history', userKeyPart),
        () => HistoryTreeItem.create(),
        CACHE_TTL.HISTORY,
      ),
    );
    console.timeEnd(logLabel);

    return treeData;
  }
}
