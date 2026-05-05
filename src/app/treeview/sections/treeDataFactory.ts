import { TreeData } from '../TreeData';
import type { TreeItem } from '../TreeItem';

export function createTreeDataFromTreeItemChildren(
  treeItem?: TreeItem | null,
): TreeData {
  return createTreeDataFromItems(treeItem?.children || []);
}

function createTreeDataFromItems(items: TreeItem[]): TreeData {
  const treeData = new TreeData();

  items.forEach((item) => treeData.add(item));

  return treeData;
}
