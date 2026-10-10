import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { Album } from 'src/bandcamp/domain/album/album';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Band } from 'src/bandcamp/domain/band/band';
import { saveSnapshot } from 'src/bandcamp/domain/fanData/library';
import { Metadata } from 'src/bandcamp/domain/metadata';
import { Price } from 'src/bandcamp/domain/price';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { storage } from 'src/core/shared';
import { loadReleaseBandLinks } from '../BandPreview';
import { loadRelatedArtistReleases } from '../items/relatedReleasesTreeItem';
import {
  createReleaseInformation,
  getReleaseArtistNames,
} from '../ReleasePreview';
import {
  getSavedArtistReleases,
  watchSavedPreviewLibrary,
} from '../savedPreviewLibrary';
import { TREE_ITEM_LAYOUT } from '../TreeItem';
import { ICON_EXTERNAL_LINK } from '../utils/icon';
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
  return chrome.storage.local.clear();
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

  it('shows header information without duplicate tree rows when the release is not stored', async () => {
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockResolvedValue([]);
    const preview =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(preview?.layout).toBe(TREE_ITEM_LAYOUT.TREE);
    expect(preview?.information.title).toBe('Release');
    expect(preview?.information.artist).toBe('Artist');
    expect(preview?.items).toEqual([]);
    const empty = await loadRelatedArtistReleases(
      ['Artist'],
      album.url.toString(),
    );
    expect(empty).toMatchObject({
      children: [
        { label: 'No other saved releases by this artist or these artists.' },
      ],
      showChildrenCount: false,
    });
    const getBands = rs.spyOn(BandcampStorage, 'getBands');
    const originalEvent = chrome.storage.onChanged;
    const addListener = rs.fn();
    const removeListener = rs.fn();
    Object.defineProperty(chrome.storage, 'onChanged', {
      configurable: true,
      value: { addListener, removeListener },
    });
    const changed = rs.fn();
    const stop = watchSavedPreviewLibrary(changed);
    const getKeys = rs.spyOn(storage, 'getKeys');
    const getAlbums = rs.spyOn(BandcampStorage, 'getAllAlbumsRawData');
    const information = preview!.information;
    try {
      const [links, duplicate] = await Promise.all([
        loadReleaseBandLinks(information, album.url),
        loadReleaseBandLinks(information, album.url),
      ]);
      expect(links.artists).toEqual([]);
      expect(duplicate).toEqual(links);
      const explicitLinks = await loadReleaseBandLinks(
        { ...information, artistUrl: 'https://artist.bandcamp.com/' },
        album.url,
      );
      expect(explicitLinks.artists).toEqual([]);
      expect(getKeys).toHaveBeenCalledTimes(1);
      expect(getAlbums).toHaveBeenCalledTimes(1);
      const notify = addListener.mock.calls[0][0] as (
        changes: Record<string, chrome.storage.StorageChange>,
        area: string,
      ) => void;
      notify({ '/ui/sidebar-expanded': { newValue: true } }, 'local');
      expect(changed).not.toHaveBeenCalled();
      rs.useFakeTimers();
      notify({ '/a/1': { newValue: {} } }, 'local');
      notify({ '/a/2': { newValue: {} } }, 'local');
      await rs.advanceTimersByTimeAsync(100);
      expect(changed).toHaveBeenCalledTimes(1);
      await loadReleaseBandLinks(information, album.url);
      expect(getKeys).toHaveBeenCalledTimes(2);
      expect(getAlbums).toHaveBeenCalledTimes(2);
      notify({ '/following-bands': { newValue: [] } }, 'local');
      await rs.advanceTimersByTimeAsync(100);
      expect(changed).toHaveBeenCalledTimes(2);
      await loadReleaseBandLinks(information, album.url);
      expect(getAlbums).toHaveBeenCalledTimes(2);
      notify({ '/b/1': { newValue: {} } }, 'local');
      await rs.advanceTimersByTimeAsync(100);
      await loadReleaseBandLinks(information, album.url);
      expect(getAlbums).toHaveBeenCalledTimes(2);
      await getSavedArtistReleases(['Artist']);
      expect(getAlbums).toHaveBeenCalledTimes(2);
    } finally {
      stop();
      rs.useRealTimers();
      expect(removeListener).toHaveBeenCalledWith(addListener.mock.calls[0][0]);
      Object.defineProperty(chrome.storage, 'onChanged', {
        configurable: true,
        value: originalEvent,
      });
    }
    expect(getBands).not.toHaveBeenCalled();
  });

  it('uses hydrated stored data and includes release notes in the tree', async () => {
    const stored = Album.create(
      album.url.toString(),
      album.artist,
      album.title,
      album.id,
      album.artwork.id,
      album.bandId,
      [TrackFactory.create(1, 1, 'Artist', 'First', 1)],
      Metadata.create(
        Price.create(0, 'EUR'),
        'Label',
        '2024-01-02',
        '2024-02-03',
        [],
        {
          description: 'About the release',
          credits: 'Credits text',
          artistUrl: 'https://artist.bandcamp.com/',
          publisherUrl: 'https://label.bandcamp.com/',
        },
      ),
    );
    const rawAlbums = rs
      .spyOn(BandcampStorage, 'getAlbumsRawDataByIds')
      .mockResolvedValue([stored.toRawData()]);
    const hydrated = rs
      .spyOn(BandcampStorage, 'getAlbums')
      .mockResolvedValue([stored]);
    const details = rs.spyOn(AlbumTreeItemFactory, 'createWithDetails');
    const preview =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(details).not.toHaveBeenCalled();
    expect(rawAlbums).toHaveBeenCalledTimes(1);
    expect(hydrated).toHaveBeenCalledWith([album], [stored.toRawData()]);
    expect(preview?.items.some((item) => item.label === 'Tracks')).toBe(true);
    expect(
      preview?.items.find((item) => item.label === 'About this release')
        ?.children?.[0].label,
    ).toBe('About the release');
    expect(
      preview?.items.find((item) => item.label === 'Credits')?.children?.[0]
        .label,
    ).toBe('Credits text');
    expect(preview?.information.modifiedDate).toBe('2024-02-03');
    rawAlbums.mockRestore();
    await BandcampStorage.saveAlbum(stored);
    const otherLabel = Band.create(
      15,
      'Other Label',
      'https://other-label.bandcamp.com/',
      25,
    );
    await BandcampStorage.saveBand(otherLabel);
    const otherRelease = Album.create(
      'https://other-label.bandcamp.com/album/release',
      'ARTIST',
      ' release ',
      2,
      31,
      otherLabel.id,
      [],
      stored.metadata,
    );
    await BandcampStorage.saveAlbum(otherRelease);
    await BandcampStorage.saveAlbum(
      Album.create(
        'https://unrelated.bandcamp.com/album/release',
        'Someone Else',
        'Release',
        3,
        32,
        16,
      ),
    );
    await BandcampStorage.saveAlbum(
      Album.create(
        'https://other-label.bandcamp.com/album/different-release',
        'Artist',
        'Different Release',
        4,
        33,
        otherLabel.id,
      ),
    );
    await BandcampStorage.saveAlbum(
      Album.create(
        'https://other-label.bandcamp.com/album/release',
        'Artist',
        'Release',
        5,
        31,
        otherLabel.id,
      ),
    );
    const artist = Band.create(
      11,
      'Artist',
      'https://artist.bandcamp.com/',
      21,
    );
    const label = Band.create(12, 'Label', 'https://label.bandcamp.com/', 22);
    await BandcampStorage.saveBand(artist);
    await BandcampStorage.saveBand(
      Band.create(14, 'Artist', 'https://artist-saved.bandcamp.com/', 24),
    );
    await BandcampStorage.saveBand(label);
    const labelRelease = Album.create(
      'https://label.bandcamp.com/album/label-release',
      'Someone Else',
      'Label Release',
      6,
      34,
      label.id,
      [],
      stored.metadata,
    );
    await BandcampStorage.saveAlbum(labelRelease);
    await storage.set({
      '/following-bands': [
        {
          band_id: 13,
          name: 'ARTIST',
          image_id: 23,
          url_hints: { subdomain: 'artist-other' },
          date_followed: '2024-01-01',
        },
        {
          band_id: 11,
          name: 'Artist',
          image_id: 21,
          url_hints: { subdomain: 'artist' },
          date_followed: '2024-01-01',
        },
      ],
    });
    const links = await loadReleaseBandLinks(preview!.information, stored.url);
    expect(links.artists.map((band) => band.url.toString())).toEqual([
      'https://artist.bandcamp.com/',
      'https://artist-saved.bandcamp.com/',
      'https://artist-other.bandcamp.com/',
    ]);
    expect(links.artists[0].image).toBe(artist.artwork.smallSizeUrl);
    expect(links.artists[1].image).toContain('/img/24_');
    expect(links.artists[2].image).toContain('/img/23_');
    expect(links.publisher).toEqual({
      name: 'Label',
      url: label.url,
      image: label.artwork.smallSizeUrl,
    });
    expect(links.releases).toEqual([
      {
        name: 'Other Label',
        url: otherRelease.url,
        image: otherLabel.artwork.smallSizeUrl,
      },
    ]);
    const labelHosted = await loadReleaseBandLinks(
      {
        ...preview!.information,
        artistUrl: label.url.toString(),
      },
      stored.url,
    );
    expect(labelHosted.artists.map((band) => band.name)).toEqual([
      'Artist',
      'Artist',
      'ARTIST',
    ]);
    const related = await loadRelatedArtistReleases(
      getReleaseArtistNames(preview!.information),
      stored.url.toString(),
    );
    expect(related).toMatchObject({ childrenCount: 2 });
    expect(related.children?.map((item) => item.href)).toEqual([
      otherRelease.url.toString(),
      'https://other-label.bandcamp.com/album/different-release',
    ]);
    expect(related.children?.[0].previewInformation?.title).toBe(' release ');
    expect(related.children?.[0].image).toBe(otherRelease.artwork.tinySizeUrl);
    expect(related.children?.[0].label).toBe(otherRelease.toString());
    expect(related.children?.[0].timestamp).toEqual({
      label: 'Released',
      dateTime: otherRelease.metadata?.published.toISOString(),
    });
    expect(related.children?.[1].timestamp).toBeUndefined();
    expect(related.children?.[0].buttons).toBeUndefined();
    expect(related.children?.[0].actionIcon).toBe(ICON_EXTERNAL_LINK);
    expect(related.children?.[0].hint).toBe(
      `Open release on Bandcamp\n${otherRelease.url}`,
    );
    const firstSolo = Album.create(
      'https://label.bandcamp.com/album/first-solo',
      'Artist',
      'First Solo',
      7,
      35,
      label.id,
    );
    const secondSolo = Album.create(
      'https://artist-2.bandcamp.com/album/second-solo',
      'Artist 2',
      'Second Solo',
      8,
      36,
      17,
    );
    const collaboration = Album.create(
      'https://other-label.bandcamp.com/album/collaboration',
      'Artist 2 & Artist 3',
      'Collaboration',
      9,
      37,
      otherLabel.id,
    );
    for (const release of [firstSolo, secondSolo, collaboration]) {
      await BandcampStorage.saveAlbum(release);
    }
    const artistsReleases = await loadRelatedArtistReleases(
      ['Artist', 'Artist 2'],
      `${label.url}album/current-collaboration?from=search#info`,
    );
    expect(artistsReleases.children?.map((item) => item.href)).toEqual([
      stored.url.toString(),
      otherRelease.url.toString(),
      'https://other-label.bandcamp.com/album/different-release',
      firstSolo.url.toString(),
      secondSolo.url.toString(),
      collaboration.url.toString(),
    ]);
    const compilationReleases = await loadRelatedArtistReleases(
      ['Various Artists'],
      `${label.url}album/compilation?from=search#info`,
    );
    expect(compilationReleases).toMatchObject({
      children: [
        { label: 'No other saved releases by this artist or these artists.' },
      ],
      showChildrenCount: false,
    });
    const detectedArtists = getReleaseArtistNames({
      ...preview!.information,
      artist: 'Various Artists',
      tracks: [
        { title: 'Solo', artist: 'Artist 2', position: 1 },
        { title: 'Collaboration', artist: 'Artist 2 & Artist 3', position: 2 },
      ],
    });
    expect(detectedArtists).toEqual(['Artist 2', 'Artist 3']);
    const artistReleases = await Promise.all(
      detectedArtists.map((name) =>
        loadRelatedArtistReleases([name], collaboration.url.toString()),
      ),
    );
    expect(artistReleases[0].children?.map((item) => item.href)).toEqual([
      secondSolo.url.toString(),
    ]);
    expect(artistReleases[0].children?.[0].loadPreview).toBeDefined();
    expect(artistReleases[1]).toMatchObject({
      children: [
        { label: 'No other saved releases by this artist or these artists.' },
      ],
      showChildrenCount: false,
    });
    const artistCollaboration = await loadRelatedArtistReleases(['ARTIST 2']);
    expect(artistCollaboration.children?.map((item) => item.href)).toEqual([
      secondSolo.url.toString(),
      collaboration.url.toString(),
    ]);
  });

  it('propagates storage failures instead of presenting a missing-data summary', async () => {
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockRejectedValue(
      new Error('Storage unavailable'),
    );
    await expect(
      AlbumTreeItemFactory.createWithPreview(album).loadPreview?.(),
    ).rejects.toThrow('Storage unavailable');
    rs.spyOn(BandcampStorage, 'getAllAlbumsRawData').mockRejectedValue(
      new Error('Storage unavailable'),
    );
    await expect(
      loadReleaseBandLinks(createReleaseInformation(album), album.url),
    ).rejects.toThrow('Storage unavailable');
    await expect(
      loadRelatedArtistReleases(['Artist'], album.url.toString()),
    ).rejects.toThrow('Storage unavailable');
  });

  it('loads saved collection status alongside the release preview', async () => {
    rs.spyOn(BandcampStorage, 'getAlbumsRawDataByIds').mockResolvedValue([]);
    const saved = {
      tralbum_type: 'a' as const,
      tralbum_id: album.id,
      album_id: album.id,
      band_id: album.bandId,
      band_name: album.artist.toString(),
      item_art_id: album.artwork.id,
      item_title: album.title,
      item_url: album.url.toString(),
    };
    await storage.set({ '/collection': [saved], '/wishlist': [saved] });
    const preview =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(preview?.information.collectionStatus).toEqual([
      'In collection',
      'Wishlisted',
    ]);
    await saveSnapshot({ fanId: 42, username: 'listener' }, 'wishlist', []);
    const updated =
      await AlbumTreeItemFactory.createWithPreview(album).loadPreview?.();
    expect(updated?.information.collectionStatus).toEqual(['In collection']);
    expect(await storage.getByKey('/wishlist')).toEqual([saved]);
  });
});
