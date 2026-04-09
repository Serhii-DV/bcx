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
    const historyKeyPart =
      bandcampPageData?.fanData?.username ||
      bandcampPageData?.fanData?.fan_id ||
      'anonymous';

    if (album) {
      const releaseTreeItem = await TreeItemCache.getOrCreate(
        TreeItemCache.subtreeKey('release', album.id, url.uuid),
        () => AlbumTreeItemFactory.createWithInformation(album),
        24 * 60 * 60 * 1000,
      );
      treeData.add(releaseTreeItem);
    }

    if (band) {
      const bandTreeItem = await TreeItemCache.getOrCreate(
        TreeItemCache.subtreeKey('band', band.id, url.uuid),
        async () => BandTreeItem.create(band, url),
        24 * 60 * 60 * 1000,
      );
      treeData.add(bandTreeItem);
    }

    if (bandcampPageData) {
      const fanData = bandcampPageData.fanData;
      const fanKeyPart = fanData.username || fanData.fan_id || 'anonymous';

      if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
        const fanPageDataTreeItem =
          await FanPageDataTreeItem.create(bandcampPageData);
        if (fanPageDataTreeItem) {
          treeData.add(fanPageDataTreeItem);
        }
      }

      treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('following-bands', fanKeyPart),
          () => FollowingBandsTreeItem.create(fanData.username || ''),
          60 * 60 * 1000,
        ),
      );
      treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('following-genres', fanKeyPart),
          () => FollowingGenresTreeItem.create(fanData.username || ''),
          60 * 60 * 1000,
        ),
      );
      treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('collection', fanKeyPart),
          () => CollectionTreeItem.create(fanData.username || ''),
          30 * 60 * 1000,
        ),
      );
      treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('wishlist', fanKeyPart),
          () => WishlistTreeItem.create(fanData.username || ''),
          30 * 60 * 1000,
        ),
      );
    }

    treeData.add(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('history', historyKeyPart),
          () => HistoryTreeItem.create(),
          10 * 60 * 1000,
        ),
    );
    console.timeEnd(logLabel);

    return treeData;
  }
}
