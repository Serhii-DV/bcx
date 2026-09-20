import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
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
    expect(item.previewImage).toBe(album.artwork.mediumSizeUrl);
    expect(item.previewInformation?.title).toBe('Release');
  });

  it('shows the existing summary when the release is not stored', async () => {
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockResolvedValue([]);
    const preview =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(preview?.layout).toBe(TREE_ITEM_LAYOUT.TREE);
    expect(preview?.information.title).toBe('Release');
    expect(preview?.items.map((item) => item.label)).toEqual(
      AlbumTreeItemFactory.createWithSummary(album).children?.map(
        (item) => item.label,
      ),
    );
  });

  it('uses hydrated stored data for the same tree as the release page', async () => {
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockResolvedValue([
      album.toRawData(),
    ]);
    rs.spyOn(BandcampStorage, 'getAlbums').mockResolvedValue([album]);
    const details = rs.spyOn(AlbumTreeItemFactory, 'createWithDetails');
    const preview =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(details).toHaveBeenCalledWith(AlbumDetails.fromAlbum(album));
    expect(preview?.items.some((item) => item.label === 'Tracks')).toBe(true);
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
