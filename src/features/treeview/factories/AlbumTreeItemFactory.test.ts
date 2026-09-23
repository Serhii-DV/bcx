import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { Album } from 'src/bandcamp/domain/album/album';
import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Metadata } from 'src/bandcamp/domain/metadata';
import { Price } from 'src/bandcamp/domain/price';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { storage } from 'src/core/shared';
import { TREE_ITEM_LAYOUT } from '../TreeItem';
import { AlbumTreeItemFactory } from './AlbumTreeItemFactory';

const album = AlbumFactory.fromBandcampItem({
  tralbum_type: 'a',
  tralbum_id: 1,
  token: 'test',
  album_id: 1,
  band_id: 1,
  band_name: 'Artist',
  item_art_id: 1,
  item_title: 'Release',
  item_url: 'https://artist.bandcamp.com/album/release',
  price: 0,
});

afterEach(() => {
  rs.restoreAllMocks();
});

describe('release previews', () => {
  it('keeps release rows as links with the History open icon and no children', () => {
    const item = AlbumTreeItemFactory.createWithPreview(album);
    expect(item.href).toBe(album.url.toString());
    expect(item.buttons?.[0].href).toBe(item.href);
    expect(item.children).toBeUndefined();
    expect(item.actionIcon).toBeUndefined();
    expect(item.loadPreview).toBeDefined();
    expect(item.image).toBe(album.artwork.tinySizeUrl);
    expect(item.previewImage).toBe(album.artwork.largeSizeUrl);
    expect(item.previewInformation?.title).toBe('Release');
  });

  it('shows the existing summary when the release is not stored', async () => {
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockResolvedValue([]);
    const preview =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(preview?.layout).toBe(TREE_ITEM_LAYOUT.TREE);
    expect(preview?.information.title).toBe('Release');
    expect(preview?.items.map((item) => item.label)).toEqual([
      ...(AlbumTreeItemFactory.createWithSummary(album)
        .children?.filter(
          (item) =>
            item.label !== 'Filter' && item.href !== album.url.toString(),
        )
        .map((item) => item.label) ?? []),
      'Links',
    ]);
    expect(
      preview?.items.find((item) => item.label === 'Links')?.children?.[0].href,
    ).toBe(album.url.toString());
  });

  it('uses hydrated stored data and includes release notes in the tree', async () => {
    const stored = Album.create(
      album.url.toString(),
      album.artist,
      album.title,
      album.id,
      album.artwork.id,
      album.bandId,
      [],
      Metadata.create(
        Price.create(0, 'EUR'),
        '',
        '2024-01-02',
        '2024-01-02',
        [],
        {
          description: 'About the release',
          credits: 'Credits text',
        },
      ),
    );
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockResolvedValue([
      stored.toRawData(),
    ]);
    rs.spyOn(BandcampStorage, 'getAlbums').mockResolvedValue([stored]);
    const details = rs.spyOn(AlbumTreeItemFactory, 'createWithDetails');
    const preview =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(details).toHaveBeenCalledWith(AlbumDetails.fromAlbum(stored));
    expect(preview?.items.some((item) => item.label === 'Tracks')).toBe(true);
    expect(
      preview?.items.find((item) => item.label === 'About this release')
        ?.children?.[0].label,
    ).toBe('About the release');
    expect(
      preview?.items.find((item) => item.label === 'Credits')?.children?.[0]
        .label,
    ).toBe('Credits text');
  });

  it('propagates storage failures instead of presenting a missing-data summary', async () => {
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockRejectedValue(
      new Error('Storage unavailable'),
    );
    await expect(
      AlbumTreeItemFactory.createWithPreview(album).loadPreview?.(),
    ).rejects.toThrow('Storage unavailable');
  });

  it('loads saved collection status alongside the release preview', async () => {
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockResolvedValue([]);
    rs.spyOn(storage, 'getByKey').mockResolvedValue([
      { tralbum_type: 'a', album_id: album.id },
    ]);
    const preview =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(preview?.information.collectionStatus).toEqual([
      'In collection',
      'Wishlisted',
    ]);
  });
});
