import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { Album } from 'src/bandcamp/domain/album/album';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
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
    expect(tree.children?.every(hasItemPreview)).toBe(true);
    expect(tree.children?.[119].previewInformation?.title).toBe('Release 119');
    expect(tree.children?.some((item) => item.label === 'Show more')).toBe(
      false,
    );
  });

  it('omits Show more when all 50 entries fit in the first batch', async () => {
    rs.spyOn(History, 'search').mockResolvedValue(
      Array.from({ length: 50 }, (_, index) => ({
        id: String(index),
        url:
          index === 0
            ? 'https://artist.bandcamp.com/'
            : index === 1
              ? 'https://uncached.bandcamp.com/'
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
    ]);
    const tree = await HistoryTreeItem.createLatestVisited();
    expect(tree.children).toHaveLength(50);
    expect(tree.children?.every((item) => !item.onClick)).toBe(true);
    expect(tree.children?.every(hasItemPreview)).toBe(true);
    expect(tree.children?.[0].bandPreview).toMatchObject({
      id: 1,
      name: 'Saved Band',
    });
    expect(tree.children?.[0].bandPreview?.following).toBeUndefined();
    expect(tree.children?.[1].bandPreview).toMatchObject({
      cached: false,
      url: 'https://uncached.bandcamp.com/',
    });
    expect(tree.children?.[2].loadPreview).toBeTypeOf('function');
    expect(tree.children?.[2].previewInformation?.title).toBe('Saved release');
  });
});
