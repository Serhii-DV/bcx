import { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { isNode } from 'src/features/treeview/utils';

export type FollowingBandYearSort =
  | 'newest'
  | 'oldest'
  | 'most-bands'
  | 'fewest-bands';
export type FollowingBandCountrySort =
  | 'az'
  | 'za'
  | 'most-bands'
  | 'fewest-bands';

export function sortFollowingBandGroups(
  treeData: TreeData,
  yearSort: FollowingBandYearSort,
  countrySort: FollowingBandCountrySort,
): TreeData {
  const latest = treeData.items.find((root) => root.label === 'Latest added');
  const earliest = latest && {
    ...latest,
    label: 'Earliest followed',
    path: 'earliest-followed',
    pathKey: 'earliest-followed',
    children: [...(latest.children ?? [])].reverse().map((item, index) => ({
      ...item,
      path: `earliest-followed.${index}`,
    })),
  };
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  const bandCount = (item: TreeItem) =>
    item.childrenCount ?? item.children?.length ?? 0;
  const newestYear = (a: TreeItem, b: TreeItem) =>
    Number(b.label) - Number(a.label);
  const countryName = (a: TreeItem, b: TreeItem) => {
    if (a.label === b.label) return 0;
    if (a.label === 'Unknown country') return 1;
    if (b.label === 'Unknown country') return -1;
    return collator.compare(a.label ?? '', b.label ?? '');
  };

  return new TreeData(
    [
      ...treeData.items.map((root) => {
        if (root.label === 'Followed by Year') {
          return {
            ...root,
            children: [...(root.children ?? [])].sort((a, b) => {
              switch (yearSort) {
                case 'oldest':
                  return -newestYear(a, b);
                case 'most-bands':
                  return bandCount(b) - bandCount(a) || newestYear(a, b);
                case 'fewest-bands':
                  return bandCount(a) - bandCount(b) || newestYear(a, b);
                default:
                  return newestYear(a, b);
              }
            }),
          };
        }
        if (root.label === 'Countries') {
          return {
            ...root,
            children: [...(root.children ?? [])].sort((a, b) => {
              switch (countrySort) {
                case 'za':
                  return a.label === 'Unknown country' ||
                    b.label === 'Unknown country'
                    ? countryName(a, b)
                    : -countryName(a, b);
                case 'most-bands':
                  return bandCount(b) - bandCount(a) || countryName(a, b);
                case 'fewest-bands':
                  return bandCount(a) - bandCount(b) || countryName(a, b);
                default:
                  return countryName(a, b);
              }
            }),
          };
        }
        return root;
      }),
      ...(earliest ? [earliest] : []),
    ],
    treeData.layout,
  );
}

export function createRootSectionTabs(items: TreeItem[]) {
  const tabOrder = (item: TreeItem) =>
    (item.releasePreview && item.label === 'Releases') ||
    item.label === 'Latest added' ||
    item.label === 'All'
      ? 0
      : item.releasePreview && item.label === 'Artists'
        ? 1
        : 2;
  const orderedItems = [...items].sort((a, b) => tabOrder(a) - tabOrder(b));

  return orderedItems.flatMap((item) => {
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
