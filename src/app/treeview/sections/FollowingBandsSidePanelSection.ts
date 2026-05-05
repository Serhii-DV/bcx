import { FollowingBandsTreeItem } from '../items/FollowingBandsTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_HEADPHONES } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type { PageDataContext } from './types';

export class FollowingBandsSidePanelSection {
  static create(
    pageDataContext: PageDataContext | null,
    userKeyPart: string,
  ): SidePanelSection | null {
    return createFanDataSubtreeSection(pageDataContext, userKeyPart, {
      cacheKey: 'following-bands',
      icon: ICON_HEADPHONES,
      id: `following-bands-${userKeyPart}`,
      itemCountPath: 'following_bands_data',
      label: 'Following Bands',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.FOLLOWING_BANDS,
      createTreeItem: (username) => FollowingBandsTreeItem.create(username),
    });
  }
}
