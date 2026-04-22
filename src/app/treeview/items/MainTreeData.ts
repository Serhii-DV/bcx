import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { console } from 'src/utils/console';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import { TreeData } from '../TreeData';
import type { TreeItem } from '../TreeItem';
import { builder } from '../TreeItemBuilder';
import {
  ICON_HEADPHONES,
  ICON_HEART,
  ICON_HISTORY,
  ICON_LIBRARY,
  ICON_TAGS,
} from '../utils/icon';
import { BandTreeItem } from './BandTreeItem';
import { CollectionTreeItem } from './collection/CollectionTreeItem';
import { FanPageDataTreeItem } from './FanPageDataTreeItem';
import { FollowingBandsTreeItem } from './FollowingBandsTreeItem';
import { FollowingGenresTreeItem } from './FollowingGenresTreeItem';
import { HistoryTreeItem } from './HistoryTreeItem';
import { WishlistTreeItem } from './WishlistTreeItem';

export class MainTreeData {
  static async create(
    currentPageUrl: Url,
    page: BandPage | null,
  ): Promise<TreeData> {
    const band = page?.band || null;
    const album = page?.album || null;
    const albumDetails = page?.albumDetails || null;
    const logLabel = `[MainTreeData.create]`;
    console.log(logLabel, { currentPageUrl, page, band, album, albumDetails });
    console.time(logLabel);

    const treeData = new TreeData();
    const items: TreeItem[] = [];

    if (album) {
      items.push(
        builder(AlbumTreeItemFactory.create(album))
          .makeLazy(() =>
            AlbumTreeItemFactory.createWithDetails(
              albumDetails || AlbumDetails.fromAlbum(album),
            ),
          )
          .build(),
      );
    }

    if (band) {
      const loadBandTreeItem = async () =>
        BandTreeItem.create(band, currentPageUrl);

      if (isBandcampMusicUrl(currentPageUrl)) {
        items.push(await loadBandTreeItem());
      } else {
        items.push(
          builder(BandTreeItemFactory.create(band))
            .makeLazy(loadBandTreeItem)
            .build(),
        );
      }
    }

    if (bandcampPageData) {
      const fanData = bandcampPageData.fanData;

      if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
        items.push(
          builder({ label: `Fan: ${fanData.name}` })
            .makeLazy(() => FanPageDataTreeItem.create(bandcampPageData))
            .build(),
        );
      }

      items.push(
        builder({
          label: 'Following Bands',
          image: ICON_HEADPHONES,
          childrenCount:
            bandcampPageData.data?.following_bands_data?.item_count,
        })
          .makeLazy(() => FollowingBandsTreeItem.create(fanData.username || ''))
          .build(),
      );
      items.push(
        builder({
          label: 'Following Genres',
          image: ICON_TAGS,
          childrenCount:
            bandcampPageData.data?.following_genres_data?.item_count,
        })
          .makeLazy(() =>
            FollowingGenresTreeItem.create(fanData.username || ''),
          )
          .build(),
      );
      items.push(
        builder({
          label: 'Collection',
          image: ICON_LIBRARY,
          childrenCount:
            bandcampPageData.data?.collection_data?.item_count ??
            bandcampPageData.data?.current_fan?.collection_count ??
            bandcampPageData.data?.collection_count,
        })
          .makeLazy(() => CollectionTreeItem.create(fanData.username || ''))
          .build(),
      );
      items.push(
        builder({
          label: 'Wishlist',
          image: ICON_HEART,
          childrenCount: bandcampPageData.data?.wishlist_data?.item_count,
        })
          .makeLazy(() => WishlistTreeItem.create(fanData.username || ''))
          .build(),
      );
    }

    items.push(
      builder({ label: 'History', image: ICON_HISTORY })
        .makeLazy(() => HistoryTreeItem.createLatestVisited())
        .build(),
    );

    items.forEach((item) => {
      if (item) {
        treeData.add(item);
      }
    });

    console.timeEnd(logLabel);

    return treeData;
  }
}
