import { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { isNode } from 'src/features/treeview/utils';
import { ICON_INFO } from 'src/features/treeview/utils/icon';

export type CatalogGroupSort =
  | 'az'
  | 'za'
  | 'most-releases'
  | 'fewest-releases';
export type CatalogYearSort =
  | 'newest'
  | 'oldest'
  | 'most-releases'
  | 'fewest-releases';
export type CatalogPriceSort = 'low-to-high' | 'high-to-low';

export function createCatalogGroupSortOptions(group: 'artists' | 'tags') {
  return [
    { id: 'az', label: 'A–Z', title: `Show ${group} in alphabetical order.` },
    {
      id: 'za',
      label: 'Z–A',
      title: `Show ${group} in reverse alphabetical order.`,
    },
    {
      id: 'most-releases',
      label: 'Most releases',
      title: `Show ${group} with the most releases first.`,
    },
    {
      id: 'fewest-releases',
      label: 'Fewest releases',
      title: `Show ${group} with the fewest releases first.`,
    },
  ] as const;
}

export const catalogYearSortOptions = [
  {
    id: 'newest',
    label: 'Newest first',
    title: 'Show the newest years first.',
  },
  {
    id: 'oldest',
    label: 'Oldest first',
    title: 'Show the oldest years first.',
  },
  {
    id: 'most-releases',
    label: 'Most releases',
    title: 'Show years with the most releases first.',
  },
  {
    id: 'fewest-releases',
    label: 'Fewest releases',
    title: 'Show years with the fewest releases first.',
  },
] as const;

export const catalogPriceSortOptions = [
  {
    id: 'low-to-high',
    label: 'Low to high',
    title: 'Show lower prices first within each currency.',
  },
  {
    id: 'high-to-low',
    label: 'High to low',
    title: 'Show higher prices first within each currency.',
  },
] as const;

const itemCount = (item: TreeItem) =>
  item.childrenCount ?? item.children?.length ?? 0;

export function compareHighestPrice(a: TreeItem, b: TreeItem): number {
  const first = a.priceGroup;
  const second = b.priceGroup;
  if (!first || !second) return Number(!first) - Number(!second);
  return (
    Number(second.amount === 0) - Number(first.amount === 0) ||
    first.currency.localeCompare(second.currency) ||
    second.amount - first.amount
  );
}

export function createCatalogGroupComparator(sort: CatalogGroupSort) {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  return (a: TreeItem, b: TreeItem) => {
    const nameOrder = collator.compare(a.label ?? '', b.label ?? '');
    switch (sort) {
      case 'za':
        return -nameOrder;
      case 'most-releases':
        return itemCount(b) - itemCount(a) || nameOrder;
      case 'fewest-releases':
        return itemCount(a) - itemCount(b) || nameOrder;
      default:
        return nameOrder;
    }
  };
}

export function createCatalogYearComparator(
  sort: CatalogYearSort | 'most-bands' | 'fewest-bands',
) {
  const newestYear = (a: TreeItem, b: TreeItem) => {
    if (a.label === b.label) return 0;
    if (a.label === 'Unknown year') return 1;
    if (b.label === 'Unknown year') return -1;
    return Number(b.label) - Number(a.label);
  };
  return (a: TreeItem, b: TreeItem) => {
    switch (sort) {
      case 'oldest':
        return a.label === 'Unknown year' || b.label === 'Unknown year'
          ? newestYear(a, b)
          : -newestYear(a, b);
      case 'most-releases':
      case 'most-bands':
        return itemCount(b) - itemCount(a) || newestYear(a, b);
      case 'fewest-releases':
      case 'fewest-bands':
        return itemCount(a) - itemCount(b) || newestYear(a, b);
      default:
        return newestYear(a, b);
    }
  };
}

export function sortCatalogGroups(
  treeData: TreeData,
  artistSort: CatalogGroupSort,
  releaseYearSort: CatalogYearSort,
  addedYearSort: CatalogYearSort,
  priceSort: CatalogPriceSort = 'low-to-high',
): TreeData {
  const compareArtists = createCatalogGroupComparator(artistSort);

  return new TreeData(
    treeData.items.map((root) => {
      if (!root.releasePreview || !root.children) return root;
      // Keep lazy roots intact so their loader can hydrate the original item.
      if (root.loadChildren && !root.childrenLoaded) return root;
      if (root.label === 'Artists') {
        return {
          ...root,
          children: [...root.children].sort(compareArtists),
        };
      }
      if (root.label === 'Release years' || root.label === 'Added years') {
        const sort =
          root.label === 'Release years' ? releaseYearSort : addedYearSort;
        return {
          ...root,
          children: [...root.children].sort(createCatalogYearComparator(sort)),
        };
      }
      if (root.label === 'By Prices' && priceSort === 'high-to-low') {
        return {
          ...root,
          children: [...root.children].sort(compareHighestPrice),
        };
      }
      return root;
    }),
    treeData.layout,
  );
}

export function withEarliestFollowed(treeData: TreeData): TreeData {
  const latest = treeData.items.find((root) => root.label === 'Latest added');
  if (!latest) return treeData;
  const earliest: TreeItem = {
    ...latest,
    label: 'Earliest followed',
    path: 'earliest-followed',
    pathKey: 'earliest-followed',
    children: [...(latest.children ?? [])].reverse().map((item, index) => ({
      ...item,
      path: `earliest-followed.${index}`,
    })),
  };
  return new TreeData([...treeData.items, earliest], treeData.layout);
}

export function createRootSectionTabs(items: TreeItem[], countBadges = false) {
  const hasBandAbout = items.some((item) => item.aboutProfile);
  const tabOrder = (item: TreeItem) => {
    if (hasBandAbout && item.label === 'Releases') return -2;
    if (item.aboutProfile) return -1;
    if (
      (item.releasePreview && item.label === 'Releases') ||
      item.label === 'Latest added' ||
      item.label === 'All'
    )
      return 0;
    return item.releasePreview && item.label === 'Artists' ? 1 : 2;
  };
  const orderedItems = [...items].sort((a, b) => tabOrder(a) - tabOrder(b));

  return orderedItems.flatMap((item) => {
    if (!item.path || !isNode(item)) return [];
    const count = item.childrenCount ?? item.children?.length ?? 0;
    const showCount = count > 0 && item.showChildrenCount !== false;
    const label = item.aboutProfile ? 'About' : (item.label ?? '');
    return [
      {
        id: item.path,
        label: showCount && !countBadges ? `${label} (${count})` : label,
        image: item.aboutProfile ? ICON_INFO : item.image,
        ...(showCount && countBadges ? { count } : {}),
      },
    ];
  });
}
