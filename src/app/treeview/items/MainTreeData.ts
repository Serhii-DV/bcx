import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { console } from 'src/utils/console';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TreeData } from '../TreeData';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { deferDescendants } from '../utils';
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
    const items: TreeItem[] = [];

    if (album) {
      items.push(
        TreeItemFactory.lazy(AlbumTreeItemFactory.create(album), () =>
          TreeItemCache.getOrCreate(
            TreeItemCache.subtreeKey('release', album.id),
            () => AlbumTreeItemFactory.createWithInformation(album),
            CACHE_TTL.RELEASE,
          ),
        ),
      );
    }

    if (band) {
      const loadBandTreeItem = () =>
        TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('band', band.id),
          async () => BandTreeItem.create(band, url),
          CACHE_TTL.BAND,
        );

      if (isBandcampMusicUrl(url)) {
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
          TreeItemFactory.lazy(
            TreeItemFactory.fromBand(band),
            loadBandTreeItem,
          ),
        );
      }
    }

    if (bandcampPageData) {
      const fanData = bandcampPageData.fanData;

      if (fanData.fan_id !== bandcampPageData.data?.fan_data?.fan_id) {
        items.push(
          TreeItemFactory.lazy({ label: `Fan: ${fanData.name}` }, () =>
            FanPageDataTreeItem.create(bandcampPageData),
          ),
        );
      }

      items.push(
        TreeItemFactory.lazy({ label: 'Following Bands' }, () =>
          TreeItemCache.getOrCreate(
            TreeItemCache.subtreeKey(userKeyPart, 'following-bands'),
            () => FollowingBandsTreeItem.create(fanData.username || ''),
            CACHE_TTL.FOLLOWING_BANDS,
          ),
        ),
      );
      items.push(
        TreeItemFactory.lazy({ label: 'Following Genres' }, () =>
          TreeItemCache.getOrCreate(
            TreeItemCache.subtreeKey(userKeyPart, 'following-genres'),
            () => FollowingGenresTreeItem.create(fanData.username || ''),
            CACHE_TTL.FOLLOWING_GENRES,
          ),
        ),
      );
      items.push(
        TreeItemFactory.lazy({ label: 'Collection' }, () =>
          TreeItemCache.getOrCreate(
            TreeItemCache.subtreeKey(userKeyPart, 'collection'),
            () => CollectionTreeItem.create(fanData.username || ''),
            CACHE_TTL.COLLECTION,
          ),
        ),
      );
      items.push(
        TreeItemFactory.lazy({ label: 'Wishlist' }, () =>
          TreeItemCache.getOrCreate(
            TreeItemCache.subtreeKey(userKeyPart, 'wishlist'),
            () => WishlistTreeItem.create(fanData.username || ''),
            CACHE_TTL.WISHLIST,
          ),
        ),
      );
    }

    items.push(
      TreeItemFactory.lazy({ label: 'History' }, () =>
        HistoryTreeItem.createLatestVisited(),
      ),
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
