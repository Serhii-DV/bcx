import { describe, expect, it } from '@rstest/core';
import { Album } from 'src/bandcamp/domain/album/album';
import { Metadata } from 'src/bandcamp/domain/metadata';
import { Price } from 'src/bandcamp/domain/price';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import {
  createReleaseInformation,
  releaseCollectionStatus,
} from './ReleasePreview';

function album() {
  return Album.create(
    'https://artist.bandcamp.com/album/release',
    'Artist',
    'Release',
    42,
    1,
    2,
  );
}

describe('release information', () => {
  it('omits unknown metadata instead of inventing price, date or ownership', () => {
    const info = createReleaseInformation(album());
    expect(info.price).toBeUndefined();
    expect(info.date).toBeUndefined();
    expect(info.duration).toBeUndefined();
    expect(info.collectionStatus).toEqual([]);
  });

  it('shows saved notes and totals complete tracks in track order', () => {
    const release = album();
    release.metadata = Metadata.create(
      Price.create(5, 'EUR'),
      'Label',
      '2026-01-02',
      '2026-01-02',
      ['ambient', 'ambient'],
      {
        description: 'Liner notes',
        credits: 'Mastered by Engineer',
        releaseType: 'EP',
        artistUrl: 'https://artist.bandcamp.com/',
        publisherUrl: 'https://label.bandcamp.com/',
        minimumPrice: 5,
      },
    );
    release.tracks = [
      TrackFactory.create(2, 2, 'Artist', 'Second', 1, undefined, '00:31:00'),
      TrackFactory.create(
        1,
        1,
        'Artist',
        'First',
        1,
        'https://artist.bandcamp.com/track/first',
        '00:30:00',
      ),
    ];
    const info = createReleaseInformation(release);
    expect(info).toMatchObject({
      date: '2026-01-02',
      price: 'From 5 EUR',
      publisher: 'Label',
      releaseType: 'EP',
      description: 'Liner notes',
      credits: 'Mastered by Engineer',
      duration: '1:01:00',
      tags: ['ambient'],
    });
    expect(info.tracks.map((track) => track.title)).toEqual([
      'First',
      'Second',
    ]);
    expect(release.tracks[0].title).toBe('Second');
  });

  it('does not label incomplete track durations as a total', () => {
    const release = album();
    release.tracks = [
      TrackFactory.create(1, 1, 'Artist', 'First', 1, undefined, '00:03:00'),
      TrackFactory.create(2, 2, 'Artist', 'Second', 1),
    ];
    expect(createReleaseInformation(release).duration).toBeUndefined();
  });

  it('hides missing offers and invalid dates, and rejects unsafe links', () => {
    const release = album();
    release.metadata = Metadata.create(
      Price.create(0, 'USD'),
      '',
      'invalid',
      'invalid',
      [],
      {
        priceAvailable: false,
        artistUrl: 'javascript:alert(1)',
        publisherUrl: 'data:text/html,bad',
      },
    );
    expect(createReleaseInformation(release)).toMatchObject({
      price: undefined,
      date: undefined,
      artistUrl: undefined,
      publisherUrl: undefined,
    });
  });
});

describe('saved collection status', () => {
  it('recognizes saved album IDs and URLs in either list', () => {
    expect(
      releaseCollectionStatus(
        album(),
        [{ tralbum_type: 'a', album_id: 42 }],
        [{ item_url: album().url.toString() }],
      ),
    ).toEqual(['In collection', 'Wishlisted']);
  });

  it('does not mistake an owned track for its parent album or invent negative status', () => {
    expect(
      releaseCollectionStatus(
        album(),
        [{ tralbum_type: 't', album_id: 42 }],
        undefined,
      ),
    ).toEqual([]);
    expect(
      releaseCollectionStatus(album(), { invalid: true }, [null, 42]),
    ).toEqual([]);
  });
});
