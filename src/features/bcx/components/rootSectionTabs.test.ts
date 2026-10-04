import { describe, expect, it, rs } from '@rstest/core';
import { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import {
  createRootSectionTabs,
  type FollowingBandCountrySort,
  type FollowingBandYearSort,
  sortCatalogGroups,
  sortFollowingBandGroups,
} from './rootSectionTabs';

describe('createRootSectionTabs', () => {
  it('uses root groups, their icons and full counts, excluding page links, and sorts followed-band groups', () => {
    const items: TreeItem[] = [
      { path: '0', label: 'Open page', href: 'https://example.com' },
      {
        path: '1',
        label: 'Artists',
        releasePreview: true,
        image: 'mic',
        childrenCount: 91,
        children: [{ label: 'Artist' }],
      },
      {
        path: '2',
        label: 'Releases',
        releasePreview: true,
        childrenCount: 322,
        children: [{ label: 'Release' }, { label: 'Load more' }],
      },
      {
        path: '3',
        label: 'Release years',
        children: [{ label: '2026' }, { label: '2025' }],
      },
      {
        path: '4',
        label: 'About',
        aboutProfile: { name: 'Example Band' },
        showChildrenCount: false,
        children: [{ label: 'Created' }],
      },
    ];
    expect(createRootSectionTabs(items)).toEqual([
      { id: '4', label: 'About Example Band', image: undefined },
      { id: '2', label: 'Releases (322)', image: undefined },
      { id: '1', label: 'Artists (91)', image: 'mic' },
      { id: '3', label: 'Release years (2)', image: undefined },
    ]);

    expect(
      createRootSectionTabs([
        {
          path: 'release-info',
          label: 'Release Info',
          hasChildren: true,
          showChildrenCount: false,
        },
        {
          path: 'tracks',
          label: 'Tracks',
          children: [{ label: 'First track' }],
        },
        {
          path: 'related-releases',
          label: 'Related releases',
          hasChildren: true,
          showChildrenCount: false,
        },
      ]),
    ).toEqual([
      { id: 'release-info', label: 'Release Info', image: undefined },
      { id: 'tracks', label: 'Tracks (1)', image: undefined },
      { id: 'related-releases', label: 'Related releases', image: undefined },
    ]);

    const grouped = new TreeData([
      {
        label: 'Followed by Year',
        children: [
          { label: '2025', childrenCount: 1 },
          { label: '2024', childrenCount: 3 },
          { label: '2023', childrenCount: 1 },
        ],
      },
      {
        label: 'Countries',
        children: [
          { label: 'Canada', childrenCount: 2 },
          { label: 'Denmark', childrenCount: 4 },
          { label: 'Sweden', childrenCount: 2 },
          { label: 'Unknown country', childrenCount: 1 },
        ],
      },
    ]);
    const labels = (
      year: FollowingBandYearSort,
      country: FollowingBandCountrySort,
    ) => {
      const sorted = sortFollowingBandGroups(grouped, year, country);
      return sorted.items.map((root) =>
        root.children?.map((group) => group.label),
      );
    };
    expect(labels('newest', 'az')).toEqual([
      ['2025', '2024', '2023'],
      ['Canada', 'Denmark', 'Sweden', 'Unknown country'],
    ]);
    expect(labels('oldest', 'za')).toEqual([
      ['2023', '2024', '2025'],
      ['Sweden', 'Denmark', 'Canada', 'Unknown country'],
    ]);
    expect(labels('most-bands', 'most-bands')).toEqual([
      ['2024', '2025', '2023'],
      ['Denmark', 'Canada', 'Sweden', 'Unknown country'],
    ]);
    expect(labels('fewest-bands', 'fewest-bands')).toEqual([
      ['2025', '2023', '2024'],
      ['Unknown country', 'Canada', 'Sweden', 'Denmark'],
    ]);
    expect(grouped.items[0].children?.map((group) => group.label)).toEqual([
      '2025',
      '2024',
      '2023',
    ]);

    const catalog = new TreeData([
      {
        label: 'Artists',
        releasePreview: true,
        children: [
          { label: 'Alpha', childrenCount: 1 },
          { label: 'Beta', childrenCount: 3 },
          { label: 'Gamma', childrenCount: 2 },
        ],
      },
      {
        label: 'Release years',
        releasePreview: true,
        children: [
          { label: '2025', childrenCount: 1 },
          { label: '2024', childrenCount: 3 },
          { label: 'Unknown year', childrenCount: 2 },
        ],
      },
      {
        label: 'Added years',
        releasePreview: true,
        children: [
          { label: '2025', childrenCount: 2 },
          { label: '2024', childrenCount: 1 },
        ],
      },
    ]);
    const sortedCatalog = sortCatalogGroups(
      catalog,
      'most-releases',
      'oldest',
      'fewest-releases',
    );
    expect(
      sortedCatalog.items.map((root) =>
        root.children?.map((group) => group.label),
      ),
    ).toEqual([
      ['Beta', 'Gamma', 'Alpha'],
      ['2024', '2025', 'Unknown year'],
      ['2024', '2025'],
    ]);
    expect(
      sortCatalogGroups(catalog, 'za', 'most-releases', 'newest').items.map(
        (root) => root.children?.map((group) => group.label),
      ),
    ).toEqual([
      ['Gamma', 'Beta', 'Alpha'],
      ['2024', 'Unknown year', '2025'],
      ['2025', '2024'],
    ]);
    expect(catalog.items[0].children?.[0].label).toBe('Alpha');

    const bands = new TreeData([
      {
        path: '0',
        label: 'Latest added',
        children: [
          { path: '0.0', label: 'Newest' },
          { path: '0.1', label: 'Middle' },
          { path: '0.2', label: 'Oldest' },
        ],
      },
    ]);
    const oldest = sortFollowingBandGroups(bands, 'newest', 'az').items.at(-1);
    expect(oldest?.label).toBe('Earliest followed');
    expect(oldest?.path).toBe('earliest-followed');
    expect(oldest?.children?.map((band) => [band.label, band.path])).toEqual([
      ['Oldest', 'earliest-followed.0'],
      ['Middle', 'earliest-followed.1'],
      ['Newest', 'earliest-followed.2'],
    ]);
    expect(bands.items[0].children?.map((band) => band.label)).toEqual([
      'Newest',
      'Middle',
      'Oldest',
    ]);
  });

  it('includes lazy groups without loading or mutating them', () => {
    const loadChildren = rs.fn(async () => []);
    const item: TreeItem = {
      path: '0',
      label: 'Release years',
      childrenCount: 91,
      loadChildren,
    };
    const tabs = createRootSectionTabs([
      item,
      { path: '1', label: 'Unavailable', hasChildren: true, children: [] },
      { path: '2', label: 'All', hasChildren: true },
      { path: '3', label: 'No longer listed', hasChildren: true },
    ]);
    expect(tabs.map((tab) => tab.label)).toEqual([
      'All',
      'Release years (91)',
      'Unavailable',
      'No longer listed',
    ]);
    expect(loadChildren).not.toHaveBeenCalled();
    expect(item.children).toBeUndefined();
    const lazyCatalogRoot = {
      ...item,
      releasePreview: true,
      children: [{ label: 'Unknown year' }],
      childrenLoaded: false,
    };
    expect(
      sortCatalogGroups(
        new TreeData([lazyCatalogRoot]),
        'az',
        'oldest',
        'newest',
      ).items[0],
    ).toBe(lazyCatalogRoot);
    expect(
      createRootSectionTabs(
        ['All', 'Bands', 'Releases', 'Tracks'].map((label, index) => ({
          path: String(index),
          label,
          hasChildren: true,
        })),
      ).map((tab) => tab.label),
    ).toEqual(['All', 'Bands', 'Releases', 'Tracks']);
    expect(
      createRootSectionTabs([
        {
          path: '0',
          label: 'Artists',
          releasePreview: true,
          hasChildren: true,
        },
        {
          path: '1',
          label: 'Releases',
          releasePreview: true,
          hasChildren: true,
        },
        { path: '2', label: 'Unavailable', hasChildren: true },
        { path: '3', label: 'No longer listed', hasChildren: true },
      ]).map((tab) => tab.label),
    ).toEqual(['Releases', 'Artists', 'Unavailable', 'No longer listed']);
  });

  it('respects hidden counts and excludes groups without navigation paths', () => {
    expect(
      createRootSectionTabs([
        {
          path: '0',
          label: 'About',
          children: [{ label: 'Created' }],
          showChildrenCount: false,
        },
        { label: 'Uninitialized group', hasChildren: true },
      ]),
    ).toEqual([{ id: '0', label: 'About', image: undefined }]);
  });
});
