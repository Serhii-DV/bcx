import { WishlistTreeItem } from '../items/WishlistTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_HEART } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type { PageDataContext } from './types';

export class WishlistSidePanelSection {
  static create(
    pageDataContext: PageDataContext | null,
    userKeyPart: string,
  ): SidePanelSection | null {
    return createFanDataSubtreeSection(pageDataContext, userKeyPart, {
      cacheKey: 'wishlist',
      icon: ICON_HEART,
      id: `wishlist-${userKeyPart}`,
      itemCountPath: 'wishlist_data',
      label: 'Wishlist',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.WISHLIST,
      createTreeItem: (username) => WishlistTreeItem.create(username),
    });
  }
}
