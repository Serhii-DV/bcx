import type { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import {
  setTreeItemQueryFromLabel,
  setTreeItemsQueryFromLabel,
} from '../utils';

export function createBandTreeItemWithChildren(band: Band): TreeItem {
  const treeItem = TreeItemFactory.fromBand(band);
  const children: TreeItem[] = [];

  const albumsTreeItem = TreeItemFactory.fromAlbumsByArtistNames(
    band.metadata.albums,
  );
  albumsTreeItem.children?.forEach(setTreeItemQueryFromLabel);
  children.push(albumsTreeItem);

  children.push(createBandYearsTreeItem(band));

  const keywordsTreeItem = TreeItemFactory.fromKeywords(
    band.metadata?.keywords || [],
  );
  keywordsTreeItem.children?.forEach(setTreeItemQueryFromLabel);
  children.push(keywordsTreeItem);

  treeItem.href = undefined;
  treeItem.children = children;

  return treeItem;
}

function createBandYearsTreeItem(band: Band): TreeItem {
  const children: TreeItem[] = band.metadata.years.map((year) => {
    const children: TreeItem[] = band.metadata
      .albumsByYear(year)
      .map(TreeItemFactory.fromAlbum);

    return {
      label: year.toString(),
      children: setTreeItemsQueryFromLabel(children),
    };
  });

  return {
    label: 'Years',
    open: false,
    children,
  };
}
