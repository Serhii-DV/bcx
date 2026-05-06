import { describe, expect, it } from '@rstest/core';
import { TREE_ITEM_LAYOUT } from './TreeItem';
import {
  builder,
  item,
  items,
  link,
  linkOpenPage,
  linkOrText,
  list,
  searchQuery,
  TreeItemBuilder,
  text,
} from './TreeItemBuilder';
import {
  ICON_EXTERNAL_LINK,
  ICON_FILE_TEXT,
  ICON_FUNNEL_PLUS,
  ICON_LINK,
  ICON_SQUARE_ARROW_RIGHT,
} from './utils/icon';

describe('TreeItemBuilder', () => {
  it('builds a tree item with fluent properties and children counts', () => {
    const treeItem = item('Collection')
      .withId('collection')
      .withOpen(true)
      .asTree()
      .add(text('Album'), { label: 'Track' })
      .build();

    expect(treeItem).toMatchObject({
      id: 'collection',
      label: 'Collection',
      open: true,
      layout: TREE_ITEM_LAYOUT.TREE,
      childrenCount: 2,
      children: [{ label: 'Album' }, { label: 'Track' }],
    });
  });

  it('filters undefined children when setting children directly', () => {
    const treeItem = new TreeItemBuilder()
      .withLabel('Root')
      .withChildren([{ label: 'Child' }, undefined])
      .build();

    expect(treeItem.children).toEqual([{ label: 'Child' }]);
    expect(treeItem.childrenCount).toBe(1);
  });

  it('creates consistent helper item shapes', () => {
    expect(text('Plain').build()).toMatchObject({
      label: 'Plain',
      image: ICON_FILE_TEXT,
    });

    expect(
      link('Album', 'https://artist.bandcamp.com/album/a').build(),
    ).toMatchObject({
      label: 'Album',
      href: 'https://artist.bandcamp.com/album/a',
      image: ICON_LINK,
      actionIcon: ICON_EXTERNAL_LINK,
    });

    expect(
      linkOpenPage('Album', 'https://artist.bandcamp.com/album/a').build(),
    ).toMatchObject({
      label: 'Open page: Album',
      hint: 'Open page: Album',
    });
  });

  it('marks search query helpers for filtering', () => {
    expect(searchQuery('Ambient', 42).build()).toMatchObject({
      label: 'Ambient',
      query: '42',
      hint: 'Search for "42"',
      image: ICON_FUNNEL_PLUS,
      actionIcon: ICON_SQUARE_ARROW_RIGHT,
      includeInFilterSuggestions: true,
    });
  });

  it('creates lists and falls back to text when links are unavailable', () => {
    expect(list('Tags', ['ambient', 'drone']).build()).toMatchObject({
      label: 'Tags',
      children: [
        { label: 'ambient', image: ICON_FILE_TEXT },
        { label: 'drone', image: ICON_FILE_TEXT },
      ],
    });

    expect(linkOrText('Missing link').build()).toMatchObject({
      label: 'Missing link',
      image: ICON_FILE_TEXT,
      includeInFilterSuggestions: true,
    });
  });

  it('copies existing item data without mutating the original', () => {
    const source = { label: 'Original', href: 'https://example.com' };
    const treeItem = builder(source).withLabel('Changed').withoutLink().build();

    expect(treeItem).toMatchObject({ label: 'Changed', href: undefined });
    expect(source).toEqual({
      label: 'Original',
      href: 'https://example.com',
    });
  });

  it('requires a label before build', () => {
    expect(() => new TreeItemBuilder().build()).toThrow(
      'TreeItem must have a label',
    );
  });
});
