import { describe, expect, it, rs } from '@rstest/core';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { createRootSectionTabs } from './rootSectionTabs';

describe('createRootSectionTabs', () => {
  it('uses root groups, their icons and full counts, excluding page links', () => {
    const items: TreeItem[] = [
      { path: '0', label: 'Open page', href: 'https://example.com' },
      {
        path: '1',
        label: 'Artists',
        image: 'mic',
        childrenCount: 91,
        children: [{ label: 'Artist' }],
      },
      {
        path: '2',
        label: 'Releases',
        childrenCount: 322,
        children: [{ label: 'Release' }, { label: 'Load more' }],
      },
      {
        path: '3',
        label: 'Release years',
        children: [{ label: '2026' }, { label: '2025' }],
      },
      { path: '4', label: 'About', children: [{ label: 'Created' }] },
    ];
    expect(createRootSectionTabs(items)).toEqual([
      { id: '1', label: 'Artists (91)', image: 'mic' },
      { id: '2', label: 'Releases (322)', image: undefined },
      { id: '3', label: 'Release years (2)', image: undefined },
      { id: '4', label: 'About (1)', image: undefined },
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
    expect(
      createRootSectionTabs(
        ['All', 'Bands', 'Releases', 'Tracks', 'Unavailable'].map(
          (label, index) => ({
            path: String(index),
            label,
            hasChildren: true,
          }),
        ),
      ).map((tab) => tab.label),
    ).toEqual(['All', 'Bands', 'Releases', 'Tracks', 'Unavailable']);
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
