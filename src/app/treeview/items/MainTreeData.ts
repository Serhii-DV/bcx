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
      treeData.add(await AlbumTreeItemFactory.createWithInformation(album));
    }

    if (band) {
      treeData.add(BandTreeItem.create(band, url));
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

      treeData.add(await FollowingBandsTreeItem.create(fanData.username || ''));
      treeData.add(
        await FollowingGenresTreeItem.create(fanData.username || ''),
      );
      treeData.add(await CollectionTreeItem.create(fanData.username || ''));
      treeData.add(await WishlistTreeItem.create(fanData.username || ''));
    }

    treeData.add(await HistoryTreeItem.create());
    console.timeEnd(logLabel);

    return treeData;
  }
}
