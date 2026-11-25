import type { TreeItem } from 'src/features/treeview/TreeItem';
import {
  ICON_BANKNOTE,
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_GLOBE,
  ICON_MIC,
  ICON_TAGS,
} from 'src/features/treeview/utils/icon';
import {
  catalogPriceSortOptions,
  catalogYearSortOptions,
  compareHighestPrice,
  createCatalogGroupComparator,
  createCatalogGroupSortOptions,
  createCatalogYearComparator,
} from './rootSectionTabs';

function createFilterSort<Sort extends string>(
  sortLabel: string,
  sortOptions: readonly [
    { id: Sort; label: string; title: string },
    ...{ id: Sort; label: string; title: string }[],
  ],
  createComparator: (
    id: Sort,
  ) => ((a: TreeItem, b: TreeItem) => number) | undefined,
) {
  const defaultSort = sortOptions[0].id;
  return {
    sortLabel,
    sortOptions,
    defaultSort,
    comparator(id: string) {
      return createComparator(
        sortOptions.find((option) => option.id === id)?.id ?? defaultSort,
      );
    },
  };
}

const releaseFilterCategories = [
  {
    rootLabel: 'Artists',
    label: 'Artists',
    icon: ICON_MIC,
    sort: createFilterSort(
      'Sort artists',
      createCatalogGroupSortOptions('artists'),
      createCatalogGroupComparator,
    ),
  },
  {
    rootLabel: 'Release years',
    label: 'By Release Year',
    icon: ICON_CALENDAR,
    sort: createFilterSort(
      'Sort release years',
      catalogYearSortOptions,
      createCatalogYearComparator,
    ),
  },
  {
    rootLabel: 'Added years',
    label: 'By Year Added',
    icon: ICON_CALENDAR_DAYS,
    sort: createFilterSort(
      'Sort years added',
      catalogYearSortOptions,
      createCatalogYearComparator,
    ),
  },
  {
    rootLabel: 'Tags',
    label: 'Tags',
    icon: ICON_TAGS,
    sort: createFilterSort(
      'Sort tags',
      createCatalogGroupSortOptions('tags'),
      createCatalogGroupComparator,
    ),
  },
  {
    rootLabel: 'By Prices',
    label: 'By Prices',
    icon: ICON_BANKNOTE,
    sort: createFilterSort('Sort prices', catalogPriceSortOptions, (id) =>
      id === 'high-to-low' ? compareHighestPrice : undefined,
    ),
  },
] as const;

const bandCountSortOptions = [
  {
    id: 'most-bands',
    label: 'Most bands',
    title: 'Show values with the most followed bands first.',
  },
  {
    id: 'fewest-bands',
    label: 'Fewest bands',
    title: 'Show values with the fewest followed bands first.',
  },
] as const;

export const followingBandFilterCategories = [
  {
    rootLabel: 'Followed by Year',
    label: 'By Year',
    icon: ICON_CALENDAR,
    sort: createFilterSort(
      'Sort followed years',
      [
        catalogYearSortOptions[0],
        catalogYearSortOptions[1],
        ...bandCountSortOptions,
      ],
      createCatalogYearComparator,
    ),
  },
  {
    rootLabel: 'Countries',
    label: 'By Country',
    icon: ICON_GLOBE,
    sort: createFilterSort(
      'Sort countries',
      [
        {
          id: 'az',
          label: 'A–Z',
          title: 'Show countries in alphabetical order.',
        },
        {
          id: 'za',
          label: 'Z–A',
          title: 'Show countries in reverse alphabetical order.',
        },
        ...bandCountSortOptions,
      ],
      (id) => {
        const compareNames = createCatalogGroupComparator(
          id === 'za' ? 'za' : 'az',
        );
        return (a, b) => {
          const countA = a.childrenCount ?? a.children?.length ?? 0;
          const countB = b.childrenCount ?? b.children?.length ?? 0;
          const countOrder =
            id === 'most-bands'
              ? countB - countA
              : id === 'fewest-bands'
                ? countA - countB
                : 0;
          const unknownOrder =
            Number(a.label === 'Unknown country') -
            Number(b.label === 'Unknown country');
          return countOrder || unknownOrder || compareNames(a, b);
        };
      },
    ),
  },
] as const;

export type CatalogFilterDefinition =
  | (typeof releaseFilterCategories)[number]
  | (typeof followingBandFilterCategories)[number];

export type CatalogFilterCategory = CatalogFilterDefinition['rootLabel'];

export const bandReleaseFilterCategories = releaseFilterCategories.filter(
  ({ rootLabel }) => rootLabel !== 'Added years',
);
export const fanReleaseFilterCategories = releaseFilterCategories.filter(
  ({ rootLabel }) => rootLabel !== 'Tags',
);

export type CatalogFilterSorts = Partial<Record<CatalogFilterCategory, string>>;

export type CatalogFilterMode = 'single' | 'multiple';

export interface CatalogFilterSelection {
  category: CatalogFilterCategory;
  value: string;
}

const childrenByItem = new WeakMap<TreeItem, Promise<TreeItem[]>>();

function readChildren(item: TreeItem): Promise<TreeItem[]> {
  const cached = childrenByItem.get(item);
  if (cached) return cached;

  const load = async (): Promise<TreeItem[]> => {
    if (!item.loadChildren || item.childrenLoaded) return item.children ?? [];
    const loaded = await item.loadChildren();
    if (Array.isArray(loaded)) return loaded;
    if (!loaded) throw new Error('Could not load catalog filter data');
    // Deferring a root can wrap a catalog item that has its own loader.
    return readChildren(loaded);
  };
  const pending = load().catch((error) => {
    childrenByItem.delete(item);
    throw error;
  });
  childrenByItem.set(item, pending);
  return pending;
}

function catalogItemKey(item: TreeItem): string | undefined {
  return (
    item.href ??
    (item.previewInformation?.releaseType === 'Track' &&
    item.entityId !== undefined
      ? `track:${item.entityId}`
      : undefined)
  );
}

export async function readCatalogFilterGroups(
  roots: readonly TreeItem[],
  category: CatalogFilterCategory,
): Promise<TreeItem[]> {
  const root = roots.find((item) => item.label === category);
  return root ? readChildren(root) : [];
}

export async function createCatalogPredicate(
  roots: readonly TreeItem[],
  selections: readonly CatalogFilterSelection[],
): Promise<(item: TreeItem) => boolean> {
  const keysByCategory = new Map<CatalogFilterCategory, Set<string>>();
  await Promise.all(
    selections.map(async ({ category, value }) => {
      const groups = await readCatalogFilterGroups(roots, category);
      const group = groups.find((item) => item.label === value);
      const items = group ? await readChildren(group) : [];
      const keys = keysByCategory.get(category) ?? new Set<string>();
      for (const item of items) {
        const key = catalogItemKey(item);
        if (key !== undefined) keys.add(key);
      }
      keysByCategory.set(category, keys);
    }),
  );
  const activeCategories = [...keysByCategory.values()];
  return (item) => {
    const key = catalogItemKey(item);
    return key !== undefined && activeCategories.every((keys) => keys.has(key));
  };
}
