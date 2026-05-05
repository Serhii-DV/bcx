import { FollowingGenresTreeItem } from '../items/FollowingGenresTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_TAGS } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type { PageDataContext } from './types';

export class FollowingGenresSidePanelSection {
  static create(
    pageDataContext: PageDataContext | null,
    userKeyPart: string,
  ): SidePanelSection | null {
    return createFanDataSubtreeSection(pageDataContext, userKeyPart, {
      cacheKey: 'following-genres',
      icon: ICON_TAGS,
      id: `following-genres-${userKeyPart}`,
      itemCountPath: 'following_genres_data',
      label: 'Following Genres',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.FOLLOWING_GENRES,
      createTreeItem: (username) => FollowingGenresTreeItem.create(username),
    });
  }
}
