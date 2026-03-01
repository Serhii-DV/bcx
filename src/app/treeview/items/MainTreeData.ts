import type { Album } from "src/bandcamp/domain/album/album";
import type { Band } from "src/bandcamp/domain/band/band";
import { TreeData } from "../TreeData";
import { createAlbumTreeItem } from "./AlbumTreeItem";
import { createBandTreeItemWithChildren } from "./BandTreeItem";
import { bandcampPageData } from "src/bandcamp/domain/shared";
import { FollowingBandsTreeItem } from "./FollowingBandsTreeItem";
import { FollowingFansTreeItem } from "./FollowingFansTreeItem";
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
      const albumTreeItem = createAlbumTreeItem(album);
      treeData.add(albumTreeItem);
    }

    if (band) {
      const bandReleasesTreeItem = createBandTreeItemWithChildren(band);
      treeData.add(bandReleasesTreeItem);
    }

    const fanData = bandcampPageData.fanData;

    if (bandcampPageData) {
      if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
        const fanPageDataTreeItem = await FanPageDataTreeItem.create(bandcampPageData);
        if (fanPageDataTreeItem) {
          treeData.add(fanPageDataTreeItem);
        }
      }

      treeData.add(await FollowingBandsTreeItem.create(fanData.username || ''));
      treeData.add(await FollowingFansTreeItem.create(fanData.username || ''));
      treeData.add(await FollowingGenresTreeItem.create(fanData.username || ''));
      treeData.add(await CollectionTreeItem.create(fanData.username || ''));
      treeData.add(await WishlistTreeItem.create(fanData.username || ''));
    }

    treeData.add(await HistoryTreeItem.create());

    return treeData;
  }
}
