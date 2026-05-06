import { describe, expect, it } from '@rstest/core';
import { TREE_ITEM_LAYOUT } from '../TreeItem';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';

describe('createTreeDataFromTreeItemChildren', () => {
  it('builds TreeData from a tree item children collection', () => {
    const treeData = createTreeDataFromTreeItemChildren(
      {
        label: 'Root',
        children: [
          {
            label: 'Albums',
            children: [{ label: 'Moon Safari' }],
          },
          { label: 'Tags' },
        ],
      },
      TREE_ITEM_LAYOUT.BROWSER,
    );

    expect(treeData.layout).toBe(TREE_ITEM_LAYOUT.BROWSER);
    expect(treeData.items).toEqual([
      expect.objectContaining({
        label: 'Albums',
        level: 0,
        path: '0',
        children: [
          expect.objectContaining({
            label: 'Moon Safari',
            level: 1,
            path: '0.0',
          }),
        ],
      }),
      expect.objectContaining({
        label: 'Tags',
        level: 0,
        path: '1',
      }),
    ]);
  });

  it('returns empty TreeData when no tree item is provided', () => {
    const treeData = createTreeDataFromTreeItemChildren(null);

    expect(treeData.items).toEqual([]);
    expect(treeData.layout).toBeUndefined();
  });
});
