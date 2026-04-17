import { describe, expect, it } from '@rstest/core';
import type { TreeItem } from './TreeItem';
import { deferDescendants, LAZY_TREE_ITEM_CHILDREN_THRESHOLD } from './utils';

describe('deferDescendants', () => {
  it('keeps small subtrees hydrated', () => {
    const items: TreeItem[] = [
      {
        label: 'Parent',
        children: [
          {
            label: 'Child',
          },
        ],
      },
    ];

    const deferredItems = deferDescendants(items);

    expect(deferredItems[0].children).toHaveLength(1);
    expect(deferredItems[0].childrenLoaded).toBeUndefined();
    expect(deferredItems[0].loadChildren).toBeUndefined();
  });

  it('defers larger subtrees', async () => {
    const children = Array.from(
      { length: LAZY_TREE_ITEM_CHILDREN_THRESHOLD },
      (_, index) => ({ label: `Child ${index}` }),
    );
    const items: TreeItem[] = [
      {
        label: 'Parent',
        children,
      },
    ];

    const deferredItems = deferDescendants(items);

    expect(deferredItems[0].children).toBeUndefined();
    expect(deferredItems[0].childrenLoaded).toBe(false);
    expect(deferredItems[0].hasChildren).toBe(true);
    await expect(deferredItems[0].loadChildren?.()).resolves.toBe(items[0]);
  });
});
