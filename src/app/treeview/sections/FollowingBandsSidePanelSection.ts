import { FollowingBandsTreeItem } from '../items/FollowingBandsTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_HEADPHONES } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type { SidePanelSectionsContext } from './types';

export class FollowingBandsSidePanelSection {
  static create(context: SidePanelSectionsContext): SidePanelSection | null {
    return createFanDataSubtreeSection(context, {
      cacheKey: 'following-bands',
      icon: ICON_HEADPHONES,
      id: `following-bands-${context.userKeyPart}`,
      itemCountPath: 'following_bands_data',
      label: 'Following Bands',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.FOLLOWING_BANDS,
      createTreeItem: (username) => FollowingBandsTreeItem.create(username),
    });
  }
}
