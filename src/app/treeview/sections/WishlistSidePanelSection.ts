import { WishlistTreeItem } from '../items/WishlistTreeItem';
import { ICON_HEART } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type {
  PendingSidePanelSection,
  SidePanelSectionsContext,
} from './types';

export class WishlistSidePanelSection {
  static create(
    context: SidePanelSectionsContext,
  ): PendingSidePanelSection | null {
    return createFanDataSubtreeSection(context, {
      cacheKey: 'wishlist',
      icon: ICON_HEART,
      itemCountPath: 'wishlist_data',
      label: 'Wishlist',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.WISHLIST,
      createTreeItem: (username) => WishlistTreeItem.create(username),
    });
  }
}
