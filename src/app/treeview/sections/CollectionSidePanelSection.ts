import { CollectionTreeItem } from '../items/collection/CollectionTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_LIBRARY } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createFanDataSubtreeSection } from './createFanDataSubtreeSection';
import type { PageDataContext } from './types';

export class CollectionSidePanelSection {
  static create(
    pageDataContext: PageDataContext | null,
    userKeyPart: string,
  ): SidePanelSection | null {
    return createFanDataSubtreeSection(pageDataContext, userKeyPart, {
      cacheKey: 'collection',
      icon: ICON_LIBRARY,
      id: `collection-${userKeyPart}`,
      label: 'Collection',
      ttl: SIDE_PANEL_SECTION_CACHE_TTL.COLLECTION,
      getChildrenCount: (pageData) =>
        pageData?.collection_data?.item_count ??
        pageData?.current_fan?.collection_count ??
        pageData?.collection_count,
      createTreeItem: (username) => CollectionTreeItem.create(username),
    });
  }
}
