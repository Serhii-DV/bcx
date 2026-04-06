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
import { MainTreeDataCache } from './MainTreeDataCache';

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

    if (album) {
      const releaseTreeItem = await MainTreeDataCache.getOrCreate(
        MainTreeDataCache.subtreeKey('release', album.id, url.uuid),
        () => AlbumTreeItemFactory.createWithInformation(album),
        24 * 60 * 60 * 1000,
      );
      treeData.add(releaseTreeItem);
    }

    if (band) {
      const bandTreeItem = await MainTreeDataCache.getOrCreate(
        MainTreeDataCache.subtreeKey('band', band.id, url.uuid),
        async () => BandTreeItem.create(band, url),
        24 * 60 * 60 * 1000,
      );
      treeData.add(bandTreeItem);
    }

    if (bandcampPageData) {
      const fanData = bandcampPageData.fanData;
      const fanKeyPart = fanData.fan_id || fanData.username || 'anonymous';

      if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
        const fanPageDataTreeItem =
          await FanPageDataTreeItem.create(bandcampPageData);
        if (fanPageDataTreeItem) {
          treeData.add(fanPageDataTreeItem);
        }
      }

      treeData.add(
        await MainTreeDataCache.getOrCreate(
          MainTreeDataCache.subtreeKey('following-bands', fanKeyPart),
          () => FollowingBandsTreeItem.create(fanData.username || ''),
          60 * 60 * 1000,
        ),
      );
      treeData.add(
        await MainTreeDataCache.getOrCreate(
          MainTreeDataCache.subtreeKey('following-genres', fanKeyPart),
          () => FollowingGenresTreeItem.create(fanData.username || ''),
          60 * 60 * 1000,
        ),
      );
      treeData.add(
        await MainTreeDataCache.getOrCreate(
          MainTreeDataCache.subtreeKey('collection', fanKeyPart),
          () => CollectionTreeItem.create(fanData.username || ''),
          30 * 60 * 1000,
        ),
      );
      treeData.add(
        await MainTreeDataCache.getOrCreate(
          MainTreeDataCache.subtreeKey('wishlist', fanKeyPart),
          () => WishlistTreeItem.create(fanData.username || ''),
          30 * 60 * 1000,
        ),
      );
    }

    treeData.add(
      await MainTreeDataCache.getOrCreate(
        MainTreeDataCache.subtreeKey(
          'history',
          bandcampPageData?.fanData?.fan_id || 'anonymous',
        ),
        () => HistoryTreeItem.create(),
        10 * 60 * 1000,
      ),
    );
    console.timeEnd(logLabel);

    return treeData;
  }
}
