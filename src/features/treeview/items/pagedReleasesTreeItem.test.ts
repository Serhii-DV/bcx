import { describe, expect, it } from '@rstest/core';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import type { BandcampItem } from 'src/bandcamp/domain/page/PageCollection';
import type { TreeItem } from '../TreeItem';
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';

describe('createPagedReleasesTreeItem', () => {
  it('loads releases in pages and expands them via the load more item', async () => {
    const releasesTreeItem = createPagedReleasesTreeItem({
      albums: createAlbums(25),
      errorContext: '[test]',
    });

    expect(releasesTreeItem.childrenCount).toBe(25);
    expect(releasesTreeItem.children).toHaveLength(21);

    const loadMoreTreeItem = releasesTreeItem.children?.[20];

    expect(loadMoreTreeItem?.label).toBe('Load more (20 of 25 loaded)');

    releasesTreeItem.path = 'wishlist.1';

    await loadMoreTreeItem?.onClick?.({
      element: document.createElement('button'),
      item: loadMoreTreeItem as TreeItem,
      parent: releasesTreeItem,
    });

    expect(releasesTreeItem.children).toHaveLength(25);
    expect(releasesTreeItem.children?.map((child) => child.label)).toEqual(
      createExpectedReleaseLabels(25),
    );
  });
});

function createAlbums(count: number) {
  return createWishlistItems(count).map((item) =>
    AlbumFactory.fromBandcampItem(item),
  );
}

function createWishlistItems(count: number): BandcampItem[] {
  return Array.from({ length: count }, (_, index) => ({
    tralbum_type: 'a',
    tralbum_id: index + 1,
    token: `token-${index + 1}`,
    album_id: index + 1,
    band_id: index + 1,
    band_name: `Band ${index + 1}`,
    item_art_id: index + 1000,
    item_title: `Album ${index + 1}`,
    item_url: `https://artist${index + 1}.bandcamp.com/album/album-${index + 1}`,
    price: 0,
  }));
}

function createExpectedReleaseLabels(count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `Band ${index + 1} - Album ${index + 1}`,
  );
}
