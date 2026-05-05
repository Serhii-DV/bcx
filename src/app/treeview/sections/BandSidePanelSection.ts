import type { Band } from 'src/bandcamp/domain/band/band';
import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import { BandTreeItem } from '../items/BandTreeItem';
import { TreeItemCache } from '../items/TreeItemCache';
import type { SidePanelSection } from '../SidePanelSection';
import type { TreeItem } from '../TreeItem';
import { deferDescendants } from '../utils';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';

export class BandSidePanelSection {
  static create(
    band: Band | null,
    currentPageUrl: Url,
  ): SidePanelSection | null {
    if (!band) {
      return null;
    }

    if (isBandcampMusicUrl(currentPageUrl)) {
      return createCurrentBandPageSection(band, currentPageUrl);
    }

    const bandTreeItem = BandTreeItemFactory.create(band);

    return {
      id: `band-${band.id}`,
      label: band.name,
      image: bandTreeItem.image,
      childrenCount: bandTreeItem.childrenCount,
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await TreeItemCache.getOrCreate(
            TreeItemCache.subtreeKey('band', band.id),
            async () => BandTreeItem.create(band, currentPageUrl),
            SIDE_PANEL_SECTION_CACHE_TTL.BAND,
          ),
        ),
    };
  }
}

function createCurrentBandPageSection(
  band: NonNullable<BandPage['band']>,
  currentPageUrl: Url,
): SidePanelSection {
  const bandTreeItemFromStorage = BandTreeItem.create(band, currentPageUrl);
  const children = deferDescendants(bandTreeItemFromStorage.children || []);
  const bandTreeItem: TreeItem = {
    ...bandTreeItemFromStorage,
    children,
    childrenLoaded: true,
    hasChildren: children.length > 0,
  };

  return {
    id: `band-${band.id}`,
    label: band.name,
    image: bandTreeItem.image,
    childrenCount: bandTreeItem.childrenCount,
    defaultOpen: true,
    createTreeData: async () =>
      createTreeDataFromTreeItemChildren(bandTreeItem),
  };
}
