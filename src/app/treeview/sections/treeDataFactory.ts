import { TreeData } from '../TreeData';
import type { TreeItem, TreeItemLayout } from '../TreeItem';

export function createTreeDataFromTreeItemChildren(
  treeItem?: TreeItem | null,
  layout?: TreeItemLayout,
): TreeData {
  return createTreeDataFromItems(treeItem?.children || [], layout);
}

function createTreeDataFromItems(
  items: TreeItem[],
  layout?: TreeItemLayout,
): TreeData {
  const treeData = new TreeData([], layout);

  items.forEach((item) => treeData.add(item));

  return treeData;
}
