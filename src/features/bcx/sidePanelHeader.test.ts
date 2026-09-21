import { describe, expect, it } from '@rstest/core';
import { Album } from 'src/bandcamp/domain/album/album';
import { Band } from 'src/bandcamp/domain/band/band';
import { Url } from 'src/core/url';
import { createSidePanelHeader } from './sidePanelHeader';

const band = Band.create(
  1,
  'Example Label',
  'https://example.bandcamp.com',
  123,
);
const album = Album.create(
  'https://example.bandcamp.com/album/release',
  'Artist',
  'Release',
  2,
  456,
  1,
);
const page = { band, album, albumDetails: null };

describe('side panel header', () => {
  it('uses release artwork, title and artist on the current release', () => {
    expect(
      createSidePanelHeader(
        Url.create(`${album.url}?from=search#tracks`),
        page,
      ),
    ).toEqual({
      title: 'Release',
      subtitle: 'Artist',
      imageUrl: album.artwork.smallSizeUrl,
    });
  });

  it('uses the artist or label profile on music and home pages', () => {
    for (const path of ['/', '/music']) {
      expect(
        createSidePanelHeader(
          Url.create(`https://example.bandcamp.com${path}`),
          page,
        ),
      ).toEqual({
        title: band.name,
        imageUrl: band.artwork.smallSizeUrl,
      });
    }
  });

  it('falls back instead of showing another release or hostname', () => {
    expect(
      createSidePanelHeader(
        Url.create('https://example.bandcamp.com/album/other'),
        page,
      ),
    ).toBeNull();
    expect(
      createSidePanelHeader(
        Url.create('https://other.bandcamp.com/music'),
        page,
      ),
    ).toBeNull();
    expect(createSidePanelHeader(album.url, null)).toBeNull();
  });

  it('uses the current track release and rejects stale track data', () => {
    const url = Url.create('https://example.bandcamp.com/track/single');
    const track = {
      mainEntityOfPage: url.toString(),
      name: 'Single',
      byArtist: { '@type': 'MusicGroup', name: 'Artist' },
      image: 'https://f4.bcbits.com/img/a123_7.jpg',
    };
    expect(createSidePanelHeader(url, null, track)).toEqual({
      title: 'Single',
      subtitle: 'Artist',
      imageUrl: track.image,
    });
    expect(
      createSidePanelHeader(
        Url.create('https://example.bandcamp.com/track/other'),
        null,
        track,
      ),
    ).toBeNull();
  });

  it('keeps the title when artwork is missing', () => {
    const withoutArtwork = Band.create(
      3,
      'No Image',
      'https://example.bandcamp.com',
      0,
    );
    expect(
      createSidePanelHeader(withoutArtwork.url, {
        ...page,
        band: withoutArtwork,
      }),
    ).toEqual({
      title: withoutArtwork.name,
      imageUrl: undefined,
    });
  });
});
