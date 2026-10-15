import { readSavedItems } from 'src/bandcamp/domain/fanData/library';
import type { BandcampItem } from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { TreeItemButtonFactory } from '../buttons/factory';
import { getFanItemPrice } from '../releasePrice';
import type { TreeItem } from '../TreeItem';
import { item } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { loadFanReleases } from './fanReleases';
import { withReleaseCatalog } from './releaseCatalog';

export class WishlistTreeItem {
  static async create(username: string, fanId?: number): Promise<TreeItem> {
    const builder = item('Wishlist');
    const wishlistItems = await readSavedItems<BandcampItem>('wishlist', fanId);
    const releases = await loadFanReleases(wishlistItems);
    builder.addButton(createWishlistOpenTreeItemButton(username));

    return withReleaseCatalog(builder.build(), releases, {
      fanId,
      prices: wishlistItems.map((item) => getFanItemPrice(item) ?? null),
      paginateReleases: false,
      addedAt: wishlistItems.map((item) => {
        if (!item.added?.trim()) return null;
        const date = new Date(item.added);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      }),
      addedYearSource: 'wishlist',
    });
  }
}

function createWishlistOpenTreeItemButton(username: string): TreeItemButton {
  return TreeItemButtonFactory.createExternalLink(
    'Open Wishlist',
    BandcampUrlFactory.generateWishlistUrl(username),
  );
}
