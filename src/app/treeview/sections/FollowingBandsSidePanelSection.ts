import { FollowingBandsTreeItem } from '../items/FollowingBandsTreeItem';
import { ICON_HEADPHONES } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type {
  PendingSidePanelSection,
  SidePanelSectionsContext,
} from './types';

export class FollowingBandsSidePanelSection {
  static create(
    context: SidePanelSectionsContext,
  ): PendingSidePanelSection | null {
    return createFanDataSubtreeSection(context, {
      cacheKey: 'following-bands',
      icon: ICON_HEADPHONES,
      itemCountPath: 'following_bands_data',
      label: 'Following Bands',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.FOLLOWING_BANDS,
      createTreeItem: (username) => FollowingBandsTreeItem.create(username),
    });
  }
}
