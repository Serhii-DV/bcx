import { readSavedItems } from 'src/bandcamp/domain/fanData/library';
import type { BandcampItem } from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { TreeItemButtonFactory } from '../../buttons/factory';
import type { TreeItem } from '../../TreeItem';
import { item } from '../../TreeItemBuilder';
import type { TreeItemButton } from '../../TreeItemButton';
import { loadFanReleases } from '../fanReleases';
import { withReleaseCatalog } from '../releaseCatalog';

export class CollectionTreeItem {
  static async create(username: string, fanId?: number): Promise<TreeItem> {
    const builder = item('Collection');
    const collectionItems = await readSavedItems<BandcampItem>(
      'collection',
      fanId,
    );
    const releases = await loadFanReleases(collectionItems);
    builder.addButton(createCollectionOpenTreeItemButton(username));

    return withReleaseCatalog(builder.build(), releases, {
      fanId,
      addedAt: collectionItems.map((item) => {
        if (!item.purchased?.trim()) return null;
        const date = new Date(item.purchased);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      }),
      addedYearSource: 'collection',
      releaseDates: releases.map((release) => {
        const date = release.metadata?.published;
        return date && Number.isFinite(date.getTime())
          ? date.toISOString()
          : null;
      }),
      showReleaseDate: true,
    });
  }
}

function createCollectionOpenTreeItemButton(username: string): TreeItemButton {
  return TreeItemButtonFactory.createExternalLink(
    'Open Collection',
    BandcampUrlFactory.generateFanUrl(username),
  );
}
