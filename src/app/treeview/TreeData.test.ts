import { describe, expect, it } from '@rstest/core';
import { TreeData } from './TreeData';

describe('TreeData filter suggestions', () => {
  it('collects music labels, queries, and keywords from the current tree state', () => {
    const treeData = new TreeData([
      {
        label: 'Collection',
        children: [
          {
            label: 'Artists',
            children: [
              {
                label: 'Band Name',
                query: 'band query',
              },
            ],
          },
          {
            label: 'Releases',
            children: [
              {
                label: 'Album Title',
                href: 'https://example.com/album',
                keywords: ['ambient', 'drone'],
              },
            ],
          },
          {
            label: 'Tags',
            children: [
              {
                label: 'psych',
              },
            ],
          },
        ],
      },
    ]);

    expect(treeData.filterSuggestions).toEqual([
      'Album Title',
      'Band Name',
      'ambient',
      'band query',
      'drone',
      'psych',
    ]);
  });

  it('reflects children added after the tree was created', () => {
    const treeData = new TreeData([
      {
        label: 'Collection',
        children: [],
      },
    ]);

    treeData.items[0].children?.push({
      label: 'Loaded Album',
      href: 'https://example.com/loaded-album',
      keywords: ['loaded tag'],
    });

    expect(treeData.filterSuggestions).toContain('Loaded Album');
    expect(treeData.filterSuggestions).toContain('loaded tag');
  });

  it('ignores structural tree labels', () => {
    const treeData = new TreeData([
      {
        label: 'Collection',
        children: [
          {
            label: 'Artists',
            children: [],
          },
          {
            label: 'Releases',
            children: [],
          },
        ],
      },
      {
        label: 'Wishlist',
      },
    ]);

    expect(treeData.filterSuggestions).toEqual([]);
  });

  it('excludes items explicitly disabled for filter suggestions', () => {
    const treeData = new TreeData([
      {
        label: 'Open Album Page',
        href: 'https://example.com/album',
        includeInFilterSuggestions: false,
      },
    ]);

    expect(treeData.filterSuggestions).toEqual([]);
  });
});

describe('TreeData filter', () => {
  it('matches item labels, queries, and keywords', () => {
    const treeData = new TreeData([
      {
        label: 'Collection',
        children: [
          {
            label: 'Album Title',
            query: 'artist query',
            keywords: ['ambient'],
          },
        ],
      },
      {
        label: 'History',
      },
    ]);

    expect(treeData.filter('album').items).toHaveLength(1);
    expect(treeData.filter('artist query').items).toHaveLength(1);
    expect(treeData.filter('ambient').items).toHaveLength(1);
    expect(treeData.filter('missing').items).toHaveLength(0);
  });

  it('preserves section metadata while filtering items', () => {
    const treeData = new TreeData(
      [
        {
          label: 'Collection',
          children: [{ label: 'Album Title' }],
        },
      ],
      [
        {
          id: 'collection-0',
          label: 'Collection',
          itemPath: '0',
        },
      ],
    );

    expect(treeData.filter('album').sections).toEqual(treeData.sections);
  });
});
