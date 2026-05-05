import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { console } from 'src/utils/console';
import type { FanData } from '../../types/FanData';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { SidePanelSection } from '../SidePanelSection';
import { TreeData } from '../TreeData';
import type { TreeItem } from '../TreeItem';
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

export class MainSidePanelSections {
  static async create(
    currentPageUrl: Url,
    page: BandPage | null,
    options: {
      includePageData?: boolean;
      pageData?: PageDataContext | null;
    } = {},
  ): Promise<SidePanelSection[]> {
    const includePageData = options.includePageData ?? true;
    const pageDataContext = options.pageData ?? bandcampPageData;
    const band = page?.band || null;
    const album = page?.album || null;
    const albumDetails = page?.albumDetails || null;
    const logLabel = `[MainSidePanelSections.create]`;
    console.log(logLabel, { currentPageUrl, page, band, album, albumDetails });
    console.time(logLabel);

    const userKeyPart = includePageData
      ? pageDataContext?.fanData?.username ||
        pageDataContext?.fanData?.fan_id ||
        'anonymous'
      : 'anonymous';
    const sections: PendingSidePanelSection[] = [];

    function addSection(
      section: Pick<
        PendingSidePanelSection,
        'label' | 'image' | 'childrenCount' | 'defaultOpen' | 'createTreeData'
      >,
    ) {
      sections.push(section);
    }

    if (album) {
      addSection({
        label: album.title,
        image: AlbumTreeItemFactory.create(album).image,
        createTreeData: async () => {
          const albumTreeItem = await TreeItemCache.getOrCreate(
            TreeItemCache.subtreeKey('release', album.id),
            () =>
              AlbumTreeItemFactory.createWithDetails(
                albumDetails || AlbumDetails.fromAlbum(album),
              ),
            CACHE_TTL.RELEASE,
          );

          return createTreeDataFromTreeItemChildren(albumTreeItem);
        },
      });
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

        addSection({
          label: band.name,
          image: bandTreeItem.image,
          childrenCount: bandTreeItem.childrenCount,
          defaultOpen: true,
          createTreeData: async () =>
            createTreeDataFromTreeItemChildren(bandTreeItem),
        });
      } else {
        const bandTreeItem = BandTreeItemFactory.create(band);
        addSection({
          label: band.name,
          image: bandTreeItem.image,
          childrenCount: bandTreeItem.childrenCount,
          createTreeData: async () =>
            createTreeDataFromTreeItemChildren(await loadBandTreeItem()),
        });
      }
    }

    if (includePageData && pageDataContext) {
      const fanData = pageDataContext.fanData;
      const pageData = pageDataContext.data;

      if (fanData.fan_id !== pageData?.fan_data?.fan_id) {
        addSection({
          label: `Fan: ${fanData.name}`,
          createTreeData: async () =>
            createTreeDataFromTreeItemChildren(
              await FanPageDataTreeItem.create(pageDataContext),
            ),
        });
      }

      addSection({
        label: 'Following Bands',
        image: ICON_HEADPHONES,
        childrenCount: pageData?.following_bands_data?.item_count,
        createTreeData: async () =>
          createTreeDataFromTreeItemChildren(
            await TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'following-bands'),
              () => FollowingBandsTreeItem.create(fanData.username || ''),
              CACHE_TTL.FOLLOWING_BANDS,
            ),
          ),
      });
      addSection({
        label: 'Following Genres',
        image: ICON_TAGS,
        childrenCount: pageData?.following_genres_data?.item_count,
        createTreeData: async () =>
          createTreeDataFromTreeItemChildren(
            await TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'following-genres'),
              () => FollowingGenresTreeItem.create(fanData.username || ''),
              CACHE_TTL.FOLLOWING_GENRES,
            ),
          ),
      });
      addSection({
        label: 'Collection',
        image: ICON_LIBRARY,
        childrenCount:
          pageData?.collection_data?.item_count ??
          pageData?.current_fan?.collection_count ??
          pageData?.collection_count,
        createTreeData: async () =>
          createTreeDataFromTreeItemChildren(
            await TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'collection'),
              () => CollectionTreeItem.create(fanData.username || ''),
              CACHE_TTL.COLLECTION,
            ),
          ),
      });
      addSection({
        label: 'Wishlist',
        image: ICON_HEART,
        childrenCount: pageData?.wishlist_data?.item_count,
        createTreeData: async () =>
          createTreeDataFromTreeItemChildren(
            await TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey(userKeyPart, 'wishlist'),
              () => WishlistTreeItem.create(fanData.username || ''),
              CACHE_TTL.WISHLIST,
            ),
          ),
      });
    }

    addSection({
      label: 'History',
      image: ICON_HISTORY,
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await HistoryTreeItem.createLatestVisited(),
        ),
    });

    const sidePanelSections = sections.map((section, index) => ({
      ...section,
      id: createSectionId(section.label, index),
    }));

    console.timeEnd(logLabel);

    return sidePanelSections;
  }
}

interface PageDataContext {
  data: any;
  fanData: FanData;
}

type PendingSidePanelSection = Omit<SidePanelSection, 'id'>;

function createTreeDataFromTreeItemChildren(
  treeItem?: TreeItem | null,
): TreeData {
  return createTreeDataFromItems(treeItem?.children || []);
}

function createTreeDataFromItems(items: TreeItem[]): TreeData {
  const treeData = new TreeData();

  items.forEach((item) => treeData.add(item));

  return treeData;
}

function createSectionId(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${slug || 'section'}-${index}`;
}
