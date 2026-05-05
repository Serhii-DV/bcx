import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { console } from 'src/utils/console';
import type { FanData } from '../../types/FanData';
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
    options: {
      includePageData?: boolean;
      pageData?: PageDataContext | null;
    } = {},
  ): Promise<TreeData> {
    const includePageData = options.includePageData ?? true;
    const pageDataContext = options.pageData ?? bandcampPageData;
    const band = page?.band || null;
    const album = page?.album || null;
    const albumDetails = page?.albumDetails || null;
    const logLabel = `[MainTreeData.create]`;
    console.log(logLabel, { currentPageUrl, page, band, album, albumDetails });
    console.time(logLabel);

    const treeData = new TreeData();
    const userKeyPart = includePageData
      ? pageDataContext?.fanData?.username ||
        pageDataContext?.fanData?.fan_id ||
        'anonymous'
      : 'anonymous';
    const items: TreeItem[] = [];
    const sections: PendingTreeDataSection[] = [];

    function addSectionItem(
      item: TreeItem,
      section: Pick<PendingTreeDataSection, 'label' | 'defaultOpen'>,
    ) {
      const itemPath = String(items.length);
      items.push(item);
      sections.push({ ...section, itemPath });
    }

    if (album) {
      addSectionItem(
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
        { label: album.title },
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
        const bandTreeItemFromStorage = BandTreeItem.create(
          band,
          currentPageUrl,
        );
        const children = deferDescendants(
          bandTreeItemFromStorage.children || [],
        );
        const bandTreeItem: TreeItem = {
          ...bandTreeItemFromStorage,
          children,
          childrenLoaded: true,
          hasChildren: children.length > 0,
        };

        addSectionItem(bandTreeItem, {
          label: band.name,
          defaultOpen: true,
        });
      } else {
        addSectionItem(
          builder(BandTreeItemFactory.create(band))
            .makeLazy(loadBandTreeItem)
            .build(),
          { label: band.name },
        );
      }
    }

    if (includePageData && pageDataContext) {
      const fanData = pageDataContext.fanData;
      const pageData = pageDataContext.data;

      if (fanData.fan_id !== pageData?.fan_data?.fan_id) {
        addSectionItem(
          builder({ label: `Fan: ${fanData.name}` })
            .makeLazy(() => FanPageDataTreeItem.create(pageDataContext))
            .build(),
          { label: `Fan: ${fanData.name}` },
        );
      }

      addSectionItem(
        builder({
          label: 'Following Bands',
          image: ICON_HEADPHONES,
          childrenCount: pageData?.following_bands_data?.item_count,
        })
          .makeLazy(() =>
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'following-bands'),
              () => FollowingBandsTreeItem.create(fanData.username || ''),
              CACHE_TTL.FOLLOWING_BANDS,
            ),
          )
          .build(),
        { label: 'Following Bands' },
      );
      addSectionItem(
        builder({
          label: 'Following Genres',
          image: ICON_TAGS,
          childrenCount: pageData?.following_genres_data?.item_count,
        })
          .makeLazy(() =>
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'following-genres'),
              () => FollowingGenresTreeItem.create(fanData.username || ''),
              CACHE_TTL.FOLLOWING_GENRES,
            ),
          )
          .build(),
        { label: 'Following Genres' },
      );
      addSectionItem(
        builder({
          label: 'Collection',
          image: ICON_LIBRARY,
          childrenCount:
            pageData?.collection_data?.item_count ??
            pageData?.current_fan?.collection_count ??
            pageData?.collection_count,
        })
          .makeLazy(() =>
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'collection'),
              () => CollectionTreeItem.create(fanData.username || ''),
              CACHE_TTL.COLLECTION,
            ),
          )
          .build(),
        { label: 'Collection' },
      );
      addSectionItem(
        builder({
          label: 'Wishlist',
          image: ICON_HEART,
          childrenCount: pageData?.wishlist_data?.item_count,
        })
          .makeLazy(() =>
            TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'wishlist'),
              () => WishlistTreeItem.create(fanData.username || ''),
              CACHE_TTL.WISHLIST,
            ),
          )
          .build(),
        { label: 'Wishlist' },
      );
    }

    addSectionItem(
      builder({ label: 'History', image: ICON_HISTORY })
        .makeLazy(() => HistoryTreeItem.createLatestVisited())
        .build(),
      { label: 'History' },
    );

    items.forEach((item) => {
      if (item) {
        treeData.add(item);
      }
    });
    treeData.setSections(
      sections.map((section, index) => ({
        ...section,
        id: createSectionId(section.label, index),
      })),
    );

    console.timeEnd(logLabel);

    return treeData;
  }
}

interface PageDataContext {
  data: any;
  fanData: FanData;
}

interface PendingTreeDataSection {
  label: string;
  itemPath: string;
  defaultOpen?: boolean;
}

function createSectionId(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${slug || 'section'}-${index}`;
}
