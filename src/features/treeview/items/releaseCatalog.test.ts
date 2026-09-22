import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Metadata } from 'src/bandcamp/domain/metadata';
import { Price } from 'src/bandcamp/domain/price';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { storage } from 'src/core/shared';
import {
  filterTreeBrowserItems,
  getTreeItemFilterSuggestions,
} from 'src/features/bcx/components/treeViewHelpers';
import { TreeData } from '../TreeData';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import { hydrateTreeItemChildren } from '../utils';
import { CollectionTreeItem } from './collection/CollectionTreeItem';
import { withReleaseCatalog } from './releaseCatalog';
import { TreeItemCache } from './TreeItemCache';
import { WishlistTreeItem } from './WishlistTreeItem';

beforeEach(async () => {
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
});

afterEach(() => {
  rs.restoreAllMocks();
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
  expect(action?.label).toContain('Show more');
  if (!action) throw new Error('Missing pagination action');
  await action.onClick?.({
    element: document.createElement('button'),
    item: action,
    parent: root,
  });
}

function assertArtistSuggestions(artists: TreeItem, count: number) {
  const expected = createItems(count)
    .map((item) => item.band_name)
    .sort();
  expect(getTreeItemFilterSuggestions(artists.children)).toEqual(expected);
  expect(new TreeData(artists.children ?? []).filterSuggestions).toEqual(
    expected,
  );
}

describe('release catalog previews', () => {
  it('suggests only artist names in Artists while retaining release suggestions in Releases', () => {
    const tree = withReleaseCatalog(
      { label: 'Label' },
      createItems(2).map(AlbumFactory.fromBandcampItem),
    );
    const artists = tree.children?.find((item) => item.label === 'Artists');
    const releases = tree.children?.find((item) => item.label === 'Releases');
    if (!artists || !releases) throw new Error('Missing catalog roots');
    assertArtistSuggestions(artists, 2);
    expect(getTreeItemFilterSuggestions(releases.children)).toContain(
      releases.children?.[0].label,
    );
  });
  it('filters Artists at the root while preserving their nested releases', () => {
    const albums = createItems(3).map(AlbumFactory.fromBandcampItem);
    const tree = withReleaseCatalog({ label: 'Label' }, albums);
    const artists = tree.children?.find((item) => item.label === 'Artists');
    const releases = tree.children?.find((item) => item.label === 'Releases');
    if (!artists || !releases) throw new Error('Missing catalog roots');

    const matches = filterTreeBrowserItems(
      artists.children,
      'artist 1',
      artists,
    );
    expect(matches).toEqual([artists.children?.[1]]);
    expect(matches[0]).toBe(artists.children?.[1]);
    assertPreview(matches[0].children?.[0]);
    expect(filterTreeBrowserItems(artists.children, 'Artist', artists)).toEqual(
      artists.children,
    );
    expect(
      filterTreeBrowserItems(artists.children, 'Release 1', artists),
    ).toEqual([]);
    expect(filterTreeBrowserItems(artists.children, '   ', artists)).toBe(
      artists.children,
    );
    expect(
      filterTreeBrowserItems(releases.children, 'artist 1', releases),
    ).toEqual([releases.children?.[1]]);
    expect(
      filterTreeBrowserItems(matches[0].children, 'Release 1', matches[0]),
    ).toEqual(matches[0].children);
  });

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
    expect(getTreeItemFilterSuggestions(years?.children)).toEqual([
      '2025',
      '2026',
    ]);
    expect(new TreeData(years?.children ?? []).filterSuggestions).toEqual([
      '2025',
      '2026',
    ]);

    const key = TreeItemCache.subtreeKey('label', 'Years');
    await TreeItemCache.set(key, tree);
    const restored = await TreeItemCache.get(key);
    const restoredYears = restored?.children?.find(
      (item) => item.label === 'Years',
    );
    expect(getTreeItemFilterSuggestions(restoredYears?.children)).toEqual([
      '2025',
      '2026',
    ]);
    expect(
      new TreeData(restoredYears?.children ?? []).filterSuggestions,
    ).toEqual(['2025', '2026']);
  });

  it('filters Years at the root while preserving releases inside matching years', () => {
    const albums = createItems(2).map((item, index) => {
      const year = 2025 + index;
      const album = AlbumFactory.fromBandcampItem({
        ...item,
        item_title: `Release ${year}`,
      });
      album.metadata = Metadata.create(
        Price.create(0, 'USD'),
        'Label',
        `${year}-01-01`,
        `${year}-01-01`,
      );
      return album;
    });
    const tree = withReleaseCatalog({ label: 'Label' }, albums, {
      groupByYear: true,
    });
    const years = tree.children?.find((item) => item.label === 'Years');
    if (!years) throw new Error('Missing Years root');

    const matches = filterTreeBrowserItems(years.children, '2026', years);
    expect(matches.map((item) => item.label)).toEqual(['2026']);
    expect(matches[0]).toBe(years.children?.[0]);
    assertPreview(matches[0].children?.[0]);
    expect(filterTreeBrowserItems(years.children, '202', years)).toEqual(
      years.children,
    );
    expect(filterTreeBrowserItems(years.children, 'Release', years)).toEqual(
      [],
    );
    expect(filterTreeBrowserItems(years.children, '   ', years)).toBe(
      years.children,
    );
    expect(
      filterTreeBrowserItems(matches[0].children, 'Release 2026', matches[0]),
    ).toEqual(matches[0].children);
  });

  for (const [label, create] of [
    ['Collection', () => CollectionTreeItem.create('listener')],
    ['Wishlist', () => WishlistTreeItem.create('listener')],
  ] as const) {
    it(`${label} preserves nested previews and list loading behavior after a session cache round trip`, async () => {
      const collectionItems = createItems(25).map((item, index) => ({
        ...item,
        purchased:
          index < 20 ? '02 Jan 2025 03:04:05 GMT' : '03 Feb 2024 04:05:06 GMT',
      }));
      await storage.set({
        '/collection': collectionItems,
        '/wishlist': createItems(25),
      });
      if (label === 'Collection') {
        const storedAlbum = AlbumFactory.fromBandcampItem(collectionItems[0]);
        storedAlbum.metadata = Metadata.create(
          Price.create(0, 'USD'),
          'Artist 0',
          '1999-01-01',
          '1999-01-01',
        );
        await BandcampStorage.saveAlbum(storedAlbum);
      }
      const original = await create();
      if (label === 'Wishlist') {
        for (const name of ['Artists', 'Releases']) {
          expect(
            original.children?.find((item) => item.label === name)?.children,
          ).toHaveLength(25);
        }
      }
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
      if (label === 'Collection') {
        const addedYears = restored?.children?.find(
          (item) => item.label === 'Added years',
        );
        const releaseYears = restored?.children?.find(
          (item) => item.label === 'Release years',
        );
        expect(restored?.children?.map((item) => item.label)).toEqual([
          'Artists',
          'Releases',
          'Release years',
          'Added years',
        ]);
        expect(addedYears?.children?.map((item) => item.label)).toEqual([
          '2025',
          '2024',
        ]);
        expect(addedYears?.releasePreview).toBe(true);
        expect(addedYears?.layout).toBe(TREE_ITEM_LAYOUT.BROWSER);
        expect(addedYears?.children?.[0].children).toHaveLength(20);
        expect(addedYears?.children?.[1].children).toHaveLength(5);
        expect(addedYears?.children?.[1].children?.[0].timestamp).toEqual({
          label: 'Added',
          dateTime: '2024-02-03T04:05:06.000Z',
        });
        assertPreview(addedYears?.children?.[1].children?.[0]);
        expect(releaseYears?.releasePreview).toBe(true);
        expect(releaseYears?.layout).toBe(TREE_ITEM_LAYOUT.BROWSER);
        expect(releaseYears?.children).toBeUndefined();

        const fetchMock = rs
          .spyOn(globalThis, 'fetch')
          .mockImplementation(async (input) => {
            const index = Number(
              new URL(String(input)).hostname.match(/^artist(\d+)/)?.[1],
            );
            if (index === 24) return new Response('', { status: 404 });
            const year = index < 12 ? 2021 : 2020;
            return new Response(
              `<script type="application/ld+json">${JSON.stringify({
                '@type': 'MusicAlbum',
                datePublished: `${year}-03-04`,
              })}</script>`,
            );
          });
        if (!releaseYears) throw new Error('Missing Release years root');
        await hydrateTreeItemChildren(releaseYears);
        const groups = releaseYears.children;
        expect(releaseYears.childrenLoaded).toBe(true);
        expect(groups?.map((item) => item.label)).toEqual([
          '2021',
          '2020',
          '1999',
          'Unknown year',
        ]);
        expect(groups?.map((item) => item.children?.length)).toEqual([
          11, 12, 1, 1,
        ]);
        expect(groups?.[2].children?.[0].href).toBe(
          collectionItems[0].item_url,
        );
        expect(groups?.[3].children?.[0].href).toBe(
          collectionItems[24].item_url,
        );
        expect(groups?.[0].children?.[0].timestamp?.label).toBe('Added');
        expect(fetchMock).toHaveBeenCalledTimes(24);
      }
      expect(artists?.releasePreview).toBe(true);
      expect(releases?.releasePreview).toBe(true);
      assertPreview(artists?.children?.[0].children?.[0]);
      assertPreview(releases?.children?.[0]);
      expect(
        (await artists?.children?.[0].children?.[0].loadPreview?.())?.items
          .length,
      ).toBeGreaterThan(0);
      if (!artists || !releases) throw new Error('Missing catalog roots');
      if (label === 'Collection') {
        expect(artists.children?.[0].children?.[0].timestamp).toEqual({
          label: 'Added',
          dateTime: '2025-01-02T03:04:05.000Z',
        });
        expect(releases.children?.[0].timestamp).toEqual({
          label: 'Added',
          dateTime: '2025-01-02T03:04:05.000Z',
        });
      }
      assertArtistSuggestions(artists, 25);
      const filteredArtists = filterTreeBrowserItems(
        artists.children,
        'Artist 24',
        artists,
      );
      expect(filteredArtists.map((item) => item.label)).toEqual(['Artist 24']);
      assertPreview(filteredArtists[0].children?.[0]);
      if (label === 'Collection') await loadMore(releases);
      expect(releases.children).toHaveLength(25);
      assertPreview(releases.children?.[24]);
      if (label === 'Collection') {
        expect(releases.children?.[24].timestamp).toEqual({
          label: 'Added',
          dateTime: '2024-02-03T04:05:06.000Z',
        });
      }
      expect(releases.children?.map((item) => item.href)).toEqual(
        createItems(25).map((item) => item.item_url),
      );

      expect(artists.children).toHaveLength(25);
      assertPreview(artists.children?.[24].children?.[0]);
    });
  }
});
