import type { TreeItem } from 'src/features/treeview/TreeItem';
import { isNode } from 'src/features/treeview/utils';

export function createRootSectionTabs(items: TreeItem[]) {
  return items.flatMap((item) => {
    if (!item.path || !isNode(item)) return [];
    const count = item.childrenCount ?? item.children?.length ?? 0;
    const label = item.label ?? '';
    return [
      {
        id: item.path,
        label:
          count > 0 && item.showChildrenCount !== false
            ? `${label} (${count})`
            : label,
        image: item.image,
      },
    ];
  });
}
