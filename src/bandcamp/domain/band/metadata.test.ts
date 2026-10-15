import { describe, expect, it } from '@rstest/core';
import { Album } from '../album/album';
import { BandcampStorage } from '../storage';
import { isRawBand } from '../storage/musicLibraryProtocol';
import { TrackFactory } from '../track/factory';
import { Band } from './band';
import { BandMetadata } from './metadata';

const profile = {
  location: 'Paris, France',
  biography: 'Independent label.',
  links: [{ label: 'Website', url: 'https://example.com/' }],
};

const album = Album.create(
  'https://label.bandcamp.com/album/first',
  'Artist',
  'First',
  1,
  1,
  9,
);
const secondAlbum = Album.create(
  'https://label.bandcamp.com/album/second',
  'Artist',
  'Second',
  2,
  2,
  9,
);
// A standalone track may share its numeric ID with an album.
const track = TrackFactory.create(
  1,
  1,
  'Artist',
  'Single',
  3,
  'https://label.bandcamp.com/track/single',
);

describe('band metadata profile fields', () => {
  it('writes flat raw metadata and round-trips public fields and ordered releases', async () => {
    const metadata = BandMetadata.create(
      '2020-01-01',
      'EUR',
      [],
      profile.location,
      profile.biography,
      profile.links,
    );
    metadata.releases = [album, track, secondAlbum, album, track];
    expect(metadata).toMatchObject(profile);
    const raw = metadata.toRawData();
    expect(raw).toMatchObject(profile);
    expect(raw).not.toHaveProperty('profile');
    const restored = BandMetadata.fromRawData(
      raw,
      [secondAlbum, album],
      [track],
    );
    expect(BandMetadata.fromRawData(raw).toRawData().releases).toBeUndefined();
    expect(restored).toMatchObject(profile);
    expect(restored.releases).toEqual([album, track, secondAlbum]);
    expect(restored.albums).toEqual([album, secondAlbum]);
    expect(restored.tracks).toEqual([track]);
    expect(restored.trackReleases).toEqual([track]);
    expect(raw.releases).toEqual([
      { type: 'album', id: 1 },
      { type: 'track', id: 1 },
      { type: 'album', id: 2 },
    ]);
    const band = Band.create(
      9,
      'Label',
      'https://label.bandcamp.com',
      1,
      metadata,
    );
    await BandcampStorage.saveBand(band);
    const [saved] = await BandcampStorage.getBands([band.id]);
    expect(saved.metadata.toRawData()).toEqual(raw);
    expect(
      saved.metadata.releases.map((release) => release.url?.toString()),
    ).toEqual(
      [album, track, secondAlbum].map((release) => release.url?.toString()),
    );
    expect(
      isRawBand({
        ...band.toRawData(),
        metadata: { ...raw, releases: [{ type: 'other', id: 1 }] },
      }),
    ).toBe(false);
    expect(
      isRawBand({
        ...band.toRawData(),
        metadata: { ...raw, releases: [{ type: 'track', id: '1' }] },
      }),
    ).toBe(false);
    await BandcampStorage.removeTracks([track.id]);
    expect(
      (await BandcampStorage.getBands([band.id]))[0].metadata.releases.map(
        (release) => release.id,
      ),
    ).toEqual([1, 2]);
  });

  it('persists updated release order and flat profile fields', async () => {
    const metadata = BandMetadata.create(
      '2020-01-01',
      'EUR',
      [album, track, secondAlbum],
      profile.location,
      profile.biography,
      profile.links,
    );
    const band = Band.create(
      9,
      'Label',
      'https://label.bandcamp.com',
      1,
      metadata,
    );
    await BandcampStorage.saveBand(band);
    const [saved] = await BandcampStorage.getBands([9]);
    expect(saved.metadata).toMatchObject(profile);
    expect(saved.metadata.releases.map((release) => release.title)).toEqual([
      'First',
      'Single',
      'Second',
    ]);
    saved.metadata.releases = [track, secondAlbum, album];
    await BandcampStorage.saveBand(saved);
    const [raw] = await BandcampStorage.getAllBandsRawData();
    expect(raw.metadata).toMatchObject(profile);
    expect(raw.metadata.releases).toEqual([
      { type: 'track', id: 1 },
      { type: 'album', id: 2 },
      { type: 'album', id: 1 },
    ]);
  });

  it('defaults missing links and distinguishes unscanned and explicitly empty catalogs', async () => {
    expect(BandMetadata.create('2020-01-01', 'EUR').links).toEqual([]);
    expect(
      BandMetadata.fromRawData({
        created: '2020-01-01',
        currency: 'EUR',
        releases: [],
      }).links,
    ).toEqual([]);
    expect(
      BandMetadata.fromRawData({
        created: '2020-01-01',
        currency: 'EUR',
        releases: [],
        location: '',
        biography: '',
        links: [],
      }),
    ).toMatchObject({ location: '', biography: '', links: [] });
    const band = Band.create(9, 'Label', 'https://label.bandcamp.com', 1);
    band.metadata.releases = [album, track];
    await BandcampStorage.saveBand(band);
    const summary = Band.create(9, 'Label', 'https://label.bandcamp.com', 1);
    expect(summary.metadata.toRawData().releases).toBeUndefined();
    await BandcampStorage.saveBand(summary);
    expect(
      (await BandcampStorage.getBands([9]))[0].metadata.releases,
    ).toHaveLength(2);
    summary.metadata.releases = [];
    await BandcampStorage.saveBand(summary);
    const [empty] = await BandcampStorage.getBands([9]);
    expect(empty.metadata.releases).toEqual([]);
    expect(empty.metadata.toRawData().releases).toEqual([]);
    expect(empty.hasReleases).toBe(false);
    expect(
      BandMetadata.fromRawData(
        {
          created: '2020-01-01',
          currency: 'EUR',
          releases: [],
        },
        [album],
        [track],
      ).releases,
    ).toEqual([]);
  });
});
