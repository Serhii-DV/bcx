import { WishlistTreeItem } from '../items/WishlistTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_HEART } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type { SidePanelSectionsContext } from './types';

export class WishlistSidePanelSection {
  static create(context: SidePanelSectionsContext): SidePanelSection | null {
    return createFanDataSubtreeSection(context, {
      cacheKey: 'wishlist',
      icon: ICON_HEART,
      id: `wishlist-${context.userKeyPart}`,
      itemCountPath: 'wishlist_data',
      label: 'Wishlist',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.WISHLIST,
      createTreeItem: (username) => WishlistTreeItem.create(username),
    });
  }
}
