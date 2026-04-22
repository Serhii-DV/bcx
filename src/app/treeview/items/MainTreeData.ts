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
import { deferDescendants } from '../utils';
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
    const userKeyPart =
      bandcampPageData?.fanData?.username ||
      bandcampPageData?.fanData?.fan_id ||
      'anonymous';
    const items: TreeItem[] = [];

    if (album) {
      items.push(
        builder(AlbumTreeItemFactory.create(album))
          .makeLazy(() =>
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey('release', album.id),
              () =>
                AlbumTreeItemFactory.createWithDetails(
                  albumDetails || AlbumDetails.fromAlbum(album),
                ),
              CACHE_TTL.RELEASE,
            ),
          )
          .build(),
      );
    }

    if (band) {
      const loadBandTreeItem = () =>
        TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('band', band.id),
          async () => BandTreeItem.create(band, currentPageUrl),
          CACHE_TTL.BAND,
        );

      if (isBandcampMusicUrl(currentPageUrl)) {
        const cachedBandTreeItem = await loadBandTreeItem();
        const children = deferDescendants(cachedBandTreeItem.children || []);
        const bandTreeItem: TreeItem = {
          ...cachedBandTreeItem,
          children,
          childrenLoaded: true,
          hasChildren: children.length > 0,
        };

        items.push(bandTreeItem);
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
          .makeLazy(() =>
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'following-bands'),
              () => FollowingBandsTreeItem.create(fanData.username || ''),
              CACHE_TTL.FOLLOWING_BANDS,
            ),
          )
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
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'following-genres'),
              () => FollowingGenresTreeItem.create(fanData.username || ''),
              CACHE_TTL.FOLLOWING_GENRES,
            ),
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
          .makeLazy(() =>
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'collection'),
              () => CollectionTreeItem.create(fanData.username || ''),
              CACHE_TTL.COLLECTION,
            ),
          )
          .build(),
      );
      items.push(
        builder({
          label: 'Wishlist',
          image: ICON_HEART,
          childrenCount: bandcampPageData.data?.wishlist_data?.item_count,
        })
          .makeLazy(() =>
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'wishlist'),
              () => WishlistTreeItem.create(fanData.username || ''),
              CACHE_TTL.WISHLIST,
            ),
          )
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
