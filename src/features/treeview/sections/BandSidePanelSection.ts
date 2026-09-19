import type { Band } from 'src/bandcamp/domain/band/band';
import type { BandPage } from 'src/bandcamp/domain/page/BandPage';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import { BandTreeItem } from '../items/BandTreeItem';
import { createPagedReleasesTreeItem } from '../items/pagedReleasesTreeItem';
import { TreeItemCache } from '../items/TreeItemCache';
import type { SidePanelSection } from '../SidePanelSection';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
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
      defaultOpen: true,
      navigationUrls: getNavigationUrls(band, currentPageUrl),
      rootNavigation: 'tabs',
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          withReleasePreviews(
            await TreeItemCache.getOrCreate(
              TreeItemCache.subtreeKey('band', band.id),
              async () => BandTreeItem.create(band, currentPageUrl),
              SIDE_PANEL_SECTION_CACHE_TTL.BAND,
            ),
            band,
          ),
        ),
    };
  }
}

function createCurrentBandPageSection(
  band: NonNullable<BandPage['band']>,
  currentPageUrl: Url,
): SidePanelSection {
  const bandTreeItemFromStorage = withReleasePreviews(
    BandTreeItem.create(band, currentPageUrl),
    band,
  );
  const children = deferDescendants(bandTreeItemFromStorage.children || []).map(
    (child) =>
      child.label === 'Releases'
        ? { ...child, layout: TREE_ITEM_LAYOUT.BROWSER }
        : child,
  );
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
    navigationUrls: getNavigationUrls(band, currentPageUrl),
    rootNavigation: 'tabs',
    createTreeData: async () =>
      createTreeDataFromTreeItemChildren(bandTreeItem),
  };
}

function withReleasePreviews(item: TreeItem, band: Band): TreeItem {
  const releases = createPagedReleasesTreeItem({
    albums: band.metadata.albums,
    errorContext: '[Band releases]',
    withPreview: true,
  });
  const children = item.children ?? [];
  return {
    ...item,
    children: children.some((child) => child.label === 'Releases')
      ? children.map((child) => (child.label === 'Releases' ? releases : child))
      : [...children, releases],
  };
}

function getNavigationUrls(band: Band, currentPageUrl: Url): string[] {
  return [
    currentPageUrl.toString(),
    band.url.toString(),
    new URL('/music', band.url).toString(),
    ...band.metadata.albums.map((album) => album.url.toString()),
  ];
}
