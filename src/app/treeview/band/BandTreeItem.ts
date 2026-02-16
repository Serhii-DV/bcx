import type { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { updateTreeItemsQueryFromLabel } from '../utils';

export class BandTreeItem {
  static create(band: Band, withChildren: boolean = true): TreeItem {
    const children: TreeItem[] = [];

    if (withChildren) {
      const albumTreeItems = TreeItemFactory.fromAlbumsByArtistNames(
        band.metadata.albums,
      );
      children.push({
        label: 'Artist/Releases',
        open: false,
        children: updateTreeItemsQueryFromLabel(albumTreeItems),
      });

      children.push(createBandYearsTreeItem(band));

      const keywordsTreeItem = TreeItemFactory.fromKeywords(
        band.metadata?.keywords || [],
      );
      keywordsTreeItem.open = false;
      keywordsTreeItem.children = updateTreeItemsQueryFromLabel(
        keywordsTreeItem.children || [],
      );

      children.push(keywordsTreeItem);
    }

    return {
      label: band.name,
      image: band.artwork.tinySizeUrl,
      open: withChildren,
      href: !withChildren ? band.url.toString() : undefined,
      children,
    };
  }
}

function createBandYearsTreeItem(band: Band): TreeItem {
  const children: TreeItem[] = band.metadata.years.map((year) => {
    const children: TreeItem[] = band.metadata
      .albumsByYear(year)
      .map(TreeItemFactory.fromAlbum);

    return {
      label: year.toString(),
      children: updateTreeItemsQueryFromLabel(children),
    };
  });

  return {
    label: 'Years',
    open: false,
    children,
  };
}
