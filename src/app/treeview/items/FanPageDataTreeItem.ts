import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { hasOwnProperty } from 'src/utils/utils';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { updateTreeItemsCounts } from '../utils';
import { WishlistTreeItem } from './WishlistTreeItem';

export class FanPageDataTreeItem {
  static async create(pageData: PageDataContext): Promise<TreeItem | null> {
    const { fan_data } = pageData.data;

    if (!fan_data) {
      return null;
    }

    const children: TreeItem[] = [];
    children.push({
      label: 'Collection',
      href: BandcampUrlFactory.generateFanUrl(fan_data.username),
      includeInFilterSuggestions: false,
      children: createAlbumsTreeItemsFromItemsCache(
        pageData.data.item_cache.collection,
      ),
    });

    children.push(await WishlistTreeItem.create(fan_data.username));
    children.push({
      label: 'Following Bands',
      href: BandcampUrlFactory.generateFollowingBandsUrl(fan_data.username),
      includeInFilterSuggestions: false,
      children: createFollowingBandsTreeItems(pageData),
    });
    children.push({
      label: 'Following Genres',
      href: BandcampUrlFactory.generateFollowingGenresUrl(fan_data.username),
      includeInFilterSuggestions: false,
      children: createFollowingGenresTreeItems(pageData),
    });

    return {
      label: `Fan: ${fan_data.name} (${fan_data.location})`,
      children: updateTreeItemsCounts(children),
    };
  }
}

function createAlbumsTreeItemsFromItemsCache(items: any): TreeItem[] {
  const treeItems: TreeItem[] = [];
  for (const key in items) {
    if (hasOwnProperty(items, key)) {
      const item = items[key];
      const album = AlbumFactory.fromBandcampItem(item);
      const treeItem = AlbumTreeItemFactory.create(album);
      treeItems.push(treeItem);
    }
  }
  return treeItems;
}

function createFollowingBandsTreeItems(pageData: PageDataContext): TreeItem[] {
  const treeItems: TreeItem[] = [];
  const bands = pageData.data?.item_cache?.following_bands;

  for (const key in bands) {
    if (hasOwnProperty(bands, key)) {
      const item = bands[key];
      const band = Band.create(
        item.band_id,
        item.name,
        BandcampUrlFactory.generateBandUrlFromSubdomain(
          item.url_hints.subdomain,
        ),
        item.image_id,
      );
      const treeItem = BandTreeItemFactory.create(band);
      treeItems.push(treeItem);
    }
  }
  return treeItems;
}

function createFollowingGenresTreeItems(pageData: PageDataContext): TreeItem[] {
  const treeItems: TreeItem[] = [];
  const genres = pageData.data?.item_cache?.following_genres;

  for (const key in genres) {
    if (hasOwnProperty(genres, key)) {
      const item = genres[key];
      const treeItem: TreeItem = {
        label: item.display_name,
        href: item.tag_page_url,
      };
      treeItems.push(treeItem);
    }
  }
  return treeItems;
}

interface PageDataContext {
  data: any;
}
