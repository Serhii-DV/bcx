import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { Album } from 'src/bandcamp/domain/album/album';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { History } from 'src/core/history';
import { hasItemPreview, type TreeItem } from '../TreeItem';
import { HistoryTreeItem } from './HistoryTreeItem';

afterEach(() => {
  rs.restoreAllMocks();
});

async function showMore(root: TreeItem) {
  const action = root.children?.at(-1);
  expect(action?.label).toBe('Show more');
  if (!action?.onClick) throw new Error('Missing pagination action');
  await action.onClick({
    element: document.createElement('button'),
    item: action,
    parent: root,
  });
}

describe('History pagination', () => {
  it('loads metadata and shows entries in batches of 50 without replacing earlier entries', async () => {
    const entries = Array.from({ length: 120 }, (_, index) => ({
      id: String(index),
      title: `Release ${index}`,
      url: `https://artist.bandcamp.com/album/release-${index}`,
      lastVisitTime: 120 - index,
    }));
    rs.spyOn(History, 'search').mockResolvedValue(entries);
    const preload = rs
      .spyOn(BandcampStorage, 'getByUuids')
      .mockResolvedValue([]);
    const tree = await HistoryTreeItem.createLatestVisited();
    expect(tree.children).toHaveLength(51);
    expect(preload.mock.calls[0][0]).toHaveLength(50);
    expect(tree.children?.slice(0, -1).every(hasItemPreview)).toBe(true);
    await showMore(tree);
    expect(tree.children).toHaveLength(101);
    expect(preload.mock.calls[1][0]).toHaveLength(50);
    expect(tree.children?.slice(0, -1).every(hasItemPreview)).toBe(true);
    await showMore(tree);
    expect(tree.children).toHaveLength(120);
    expect(preload.mock.calls[2][0]).toHaveLength(20);
    expect(tree.children?.map((item) => item.href)).toEqual(
      entries.map((item) => item.url),
    );
    expect(tree.children?.map((item) => item.visitedAt)).toEqual(
      entries.map((item) => new Date(item.lastVisitTime).toISOString()),
    );
    expect(tree.children?.every(hasItemPreview)).toBe(true);
    expect(tree.children?.[119].previewInformation?.title).toBe('Release 119');
    expect(tree.children?.some((item) => item.label === 'Show more')).toBe(
      false,
    );
  });

  it('builds All, Bands, Releases, and Tracks tabs with previewable items', async () => {
    rs.spyOn(History, 'search').mockResolvedValue(
      Array.from({ length: 50 }, (_, index) => ({
        id: String(index),
        url:
          index === 0
            ? 'https://artist.bandcamp.com/'
            : index === 1
              ? 'https://uncached.bandcamp.com/'
              : index === 3
                ? 'https://artist.bandcamp.com/track/saved-track'
                : `https://artist.bandcamp.com/album/release-${index}`,
      })),
    );
    rs.spyOn(BandcampStorage, 'getByUuids').mockResolvedValue([
      Band.create(1, 'Saved band', 'https://artist.bandcamp.com/', 1),
      Album.create(
        'https://artist.bandcamp.com/album/release-2',
        'Saved band',
        'Saved release',
        2,
        1,
        1,
      ),
      TrackFactory.create(
        3,
        1,
        'Saved band',
        'Saved track',
        1,
        'https://artist.bandcamp.com/track/saved-track',
        '00:03:15',
      ),
    ]);
    const tree = await HistoryTreeItem.createLatestVisitedSections();
    expect(tree.children?.map((item) => item.label)).toEqual([
      'All',
      'Bands',
      'Releases',
      'Tracks',
    ]);
    expect(tree.children?.map((item) => item.childrenCount)).toEqual([
      50, 2, 47, 1,
    ]);
    expect(
      tree.children?.every(
        (item) =>
          item.hasChildren &&
          item.itemPreview &&
          item.children?.every(hasItemPreview),
      ),
    ).toBe(true);

    const all = tree.children?.[0].children;
    expect(all?.[0].bandPreview).toMatchObject({
      id: 1,
      name: 'Saved Band',
    });
    expect(all?.[0].bandPreview?.following).toBeUndefined();
    expect(all?.[1].bandPreview).toMatchObject({
      cached: false,
      url: 'https://uncached.bandcamp.com/',
    });
    expect(all?.[2].loadPreview).toBeTypeOf('function');
    expect(all?.[2].previewInformation?.title).toBe('Saved release');
    expect(all?.[3].previewInformation).toMatchObject({
      title: 'Saved track',
      releaseType: 'Track',
      duration: '3:15',
    });

    const bands = tree.children?.[1];
    const searchResult = await bands?.filterSearch?.('dream pop');
    expect(History.search).toHaveBeenLastCalledWith({
      text: 'dream pop',
      maxResults: 1000,
      startTime: 0,
    });
    expect(searchResult?.total).toBe(2);
    expect(searchResult?.items).toHaveLength(2);
    expect(
      searchResult?.items.every((item) => item.href?.endsWith('bandcamp.com/')),
    ).toBe(true);
  });
});
