import { FollowingGenresTreeItem } from '../items/FollowingGenresTreeItem';
import { ICON_TAGS } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type {
  PendingSidePanelSection,
  SidePanelSectionsContext,
} from './types';

export class FollowingGenresSidePanelSection {
  static create(
    context: SidePanelSectionsContext,
  ): PendingSidePanelSection | null {
    return createFanDataSubtreeSection(context, {
      cacheKey: 'following-genres',
      icon: ICON_TAGS,
      itemCountPath: 'following_genres_data',
      label: 'Following Genres',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.FOLLOWING_GENRES,
      createTreeItem: (username) => FollowingGenresTreeItem.create(username),
    });
  }
}
