import { beforeEach, describe, expect, it } from '@rstest/core';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Metadata } from 'src/bandcamp/domain/metadata';
import { Price } from 'src/bandcamp/domain/price';
import { storage } from 'src/core/shared';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import { CollectionTreeItem } from './collection/CollectionTreeItem';
import { withReleaseCatalog } from './releaseCatalog';
import { TreeItemCache } from './TreeItemCache';
import { WishlistTreeItem } from './WishlistTreeItem';

beforeEach(async () => {
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
});

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    tralbum_type: 'a',
    tralbum_id: index + 1,
    token: `token-${index}`,
    album_id: index + 1,
    band_id: index + 1,
    band_name: `Artist ${index}`,
    item_art_id: index + 1,
    item_title: `Release ${index}`,
    item_url: `https://artist${index}.bandcamp.com/album/release`,
    price: 0,
  }));
}

function assertPreview(release?: TreeItem) {
  expect(release?.loadPreview).toBeTypeOf('function');
  expect(release?.children).toBeUndefined();
  expect(release?.href).toContain('/album/');
  expect(release?.buttons?.[0].href).toBe(release?.href);
}

async function loadMore(root: TreeItem) {
  const action = root.children?.at(-1);
  expect(action?.label).toContain('Load more');
  if (!action) throw new Error('Missing pagination action');
  await action.onClick?.({
    element: document.createElement('button'),
    item: action,
    parent: root,
  });
}

describe('release catalog previews', () => {
  it('provides artist and year groups with previewable releases, preserving other roots', async () => {
    const albums = createItems(2).map(AlbumFactory.fromBandcampItem);
    albums[0].metadata = Metadata.create(
      Price.create(0, 'USD'),
      'Label',
      '2025-01-01',
      '2025-01-01',
    );
    albums[1].metadata = Metadata.create(
      Price.create(0, 'USD'),
      'Label',
      '2026-01-01',
      '2026-01-01',
    );
    const tree = withReleaseCatalog(
      { label: 'Label', children: [{ label: 'About' }] },
      albums,
      { groupByYear: true },
    );
    expect(tree.children?.[0].label).toBe('About');
    for (const name of ['Artists', 'Releases', 'Years']) {
      const root = tree.children?.find((item) => item.label === name);
      expect(root?.releasePreview).toBe(true);
      expect(root?.layout).toBe(TREE_ITEM_LAYOUT.BROWSER);
      assertPreview(
        name === 'Releases'
          ? root?.children?.[0]
          : root?.children?.[0].children?.[0],
      );
    }
    const years = tree.children?.find((item) => item.label === 'Years');
    expect(years?.children?.map((item) => item.label)).toEqual([
      '2026',
      '2025',
    ]);
  });

  for (const [label, create] of [
    ['Collection', () => CollectionTreeItem.create('listener')],
    ['Wishlist', () => WishlistTreeItem.create('listener')],
  ] as const) {
    it(`${label} preserves nested previews and pagination after a session cache round trip`, async () => {
      await storage.set({
        '/collection': createItems(25),
        '/wishlist': createItems(25),
      });
      const original = await create();
      const key = TreeItemCache.subtreeKey('listener', label);
      await TreeItemCache.set(key, original);
      const restored = await TreeItemCache.get(key);
      expect(restored?.releaseCatalog?.albums).toHaveLength(25);
      const artists = restored?.children?.find(
        (item) => item.label === 'Artists',
      );
      const releases = restored?.children?.find(
        (item) => item.label === 'Releases',
      );
      expect(artists?.releasePreview).toBe(true);
      expect(releases?.releasePreview).toBe(true);
      assertPreview(artists?.children?.[0].children?.[0]);
      assertPreview(releases?.children?.[0]);
      expect(
        (await artists?.children?.[0].children?.[0].loadPreview?.())?.items
          .length,
      ).toBeGreaterThan(0);
      if (!artists || !releases) throw new Error('Missing catalog roots');
      await loadMore(releases);
      expect(releases.children).toHaveLength(25);
      assertPreview(releases.children?.[24]);
      if (label === 'Wishlist') await loadMore(artists);
      expect(artists.children).toHaveLength(25);
      assertPreview(artists.children?.[24].children?.[0]);
    });
  }
});
