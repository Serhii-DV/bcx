import type { TreeItem } from 'src/features/treeview/TreeItem';
import {
  ICON_BANKNOTE,
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
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

export type ReleaseFilterCategory =
  (typeof releaseFilterCategories)[number]['rootLabel'];

export type ReleaseFilterDefinition = (typeof releaseFilterCategories)[number];

export const bandReleaseFilterCategories = releaseFilterCategories.filter(
  ({ rootLabel }) => rootLabel !== 'Added years',
);
export const fanReleaseFilterCategories = releaseFilterCategories.filter(
  ({ rootLabel }) => rootLabel !== 'Tags',
);

export type ReleaseFilterSorts = Partial<Record<ReleaseFilterCategory, string>>;

export type ReleaseFilterMode = 'single' | 'multiple';

export interface ReleaseFilterSelection {
  category: ReleaseFilterCategory;
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
    if (!loaded) throw new Error('Could not load release filter data');
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

function releaseKey(item: TreeItem): string | undefined {
  return (
    item.href ??
    (item.previewInformation?.releaseType === 'Track' &&
    item.entityId !== undefined
      ? `track:${item.entityId}`
      : undefined)
  );
}

export async function readReleaseFilterGroups(
  roots: readonly TreeItem[],
  category: ReleaseFilterCategory,
): Promise<TreeItem[]> {
  const root = roots.find((item) => item.label === category);
  return root ? readChildren(root) : [];
}

export async function createReleasePredicate(
  roots: readonly TreeItem[],
  selections: readonly ReleaseFilterSelection[],
): Promise<(item: TreeItem) => boolean> {
  const keysByCategory = new Map<ReleaseFilterCategory, Set<string>>();
  await Promise.all(
    selections.map(async ({ category, value }) => {
      const groups = await readReleaseFilterGroups(roots, category);
      const group = groups.find((item) => item.label === value);
      const releases = group ? await readChildren(group) : [];
      const keys = keysByCategory.get(category) ?? new Set<string>();
      for (const release of releases) {
        const key = releaseKey(release);
        if (key !== undefined) keys.add(key);
      }
      keysByCategory.set(category, keys);
    }),
  );
  const activeCategories = [...keysByCategory.values()];
  return (item) => {
    const key = releaseKey(item);
    return key !== undefined && activeCategories.every((keys) => keys.has(key));
  };
}
