import { describe, expect, it } from '@rstest/core';
import { TreeData } from './TreeData';

describe('TreeData filter suggestions', () => {
  it('collects labels, queries, and keywords from the current tree state', () => {
    const treeData = new TreeData([
      {
        label: 'Collection',
        children: [
          {
            label: 'Album Title',
            query: 'artist query',
            keywords: ['ambient', 'drone'],
          },
        ],
      },
    ]);

    expect(treeData.filterSuggestions).toEqual([
      'Album Title',
      'Collection',
      'ambient',
      'artist query',
      'drone',
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
      keywords: ['loaded tag'],
    });

    expect(treeData.filterSuggestions).toContain('Loaded Album');
    expect(treeData.filterSuggestions).toContain('loaded tag');
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
});
