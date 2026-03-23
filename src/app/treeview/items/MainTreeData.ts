import type { Album } from "src/bandcamp/domain/album/album";
import type { Band } from "src/bandcamp/domain/band/band";
import { TreeData } from "../TreeData";
import { AlbumTreeItem } from "./AlbumTreeItem";
import { BandTreeItem } from "./BandTreeItem";
import { bandcampPageData } from "src/bandcamp/domain/shared";
import { FollowingBandsTreeItem } from "./FollowingBandsTreeItem";
import { FollowingGenresTreeItem } from "./FollowingGenresTreeItem";
import { CollectionTreeItem } from "./CollectionTreeItem";
import { WishlistTreeItem } from "./WishlistTreeItem";
import { HistoryTreeItem } from "./HistoryTreeItem";
import { FanPageDataTreeItem } from "./FanPageDataTreeItem";

export class MainTreeData {
  static async create(
    band: Band | null,
    album: Album | null,
  ): Promise<TreeData> {
    const treeData = new TreeData();

    if (album) {
      treeData.add(AlbumTreeItem.create(album));
    }

    if (band) {
      treeData.add(BandTreeItem.create(band));
    }

    if (bandcampPageData) {
      const fanData = bandcampPageData.fanData;

      if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
        const fanPageDataTreeItem = await FanPageDataTreeItem.create(bandcampPageData);
        if (fanPageDataTreeItem) {
          treeData.add(fanPageDataTreeItem);
        }
      }

      treeData.add(await FollowingBandsTreeItem.create(fanData.username || ''));
      treeData.add(await FollowingGenresTreeItem.create(fanData.username || ''));
      treeData.add(await CollectionTreeItem.create(fanData.username || ''));
      treeData.add(await WishlistTreeItem.create(fanData.username || ''));
    }

    treeData.add(await HistoryTreeItem.create());

    return treeData;
  }
}
