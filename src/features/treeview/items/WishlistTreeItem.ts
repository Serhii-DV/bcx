import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { readCurrentItems } from 'src/bandcamp/domain/fanData/library';
import type { BandcampItem } from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { TreeItemButtonFactory } from '../buttons/factory';
import type { TreeItem } from '../TreeItem';
import { item } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { withReleaseCatalog } from './releaseCatalog';

export class WishlistTreeItem {
  static async create(username: string, fanId?: number): Promise<TreeItem> {
    const builder = item('Wishlist');
    const wishlistItems = await readCurrentItems<BandcampItem>(
      'wishlist',
      fanId,
    );
    const albums = wishlistItems.map((item) =>
      AlbumFactory.fromBandcampItem(item),
    );
    builder.addButton(createWishlistOpenTreeItemButton(username));

    return withReleaseCatalog(builder.build(), albums, {
      fanId,
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
