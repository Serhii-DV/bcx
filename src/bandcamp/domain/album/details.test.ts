import { describe, expect, it } from '@rstest/core';
import type { MusicAlbumSchema } from '../page/schema';

describe('AlbumDetails', () => {
  it('creates details from a MusicAlbum schema', async () => {
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {
        runtime: {},
        storage: {
          local: {},
          session: {},
        },
      },
    });

    const { AlbumDetails } = await import('./details');
    const schema = {
      mainEntityOfPage: 'https://example.bandcamp.com/album/example-album',
      name: '(CAT-001) Example Album (EP 2024)',
      datePublished: '2024-01-20T00:00:00Z',
      dateModified: '2024-02-21T00:00:00Z',
      keywords: ['ambient', 'drone'],
      image: 'https://f4.bcbits.com/img/a123_10.jpg',
      byArtist: {
        '@type': 'MusicGroup',
        name: 'Example Artist',
      },
      publisher: {
        name: 'Example Publisher',
      },
      albumRelease: [
        {
          musicReleaseFormat: 'DigitalFormat',
          additionalProperty: [
            {
              '@type': 'PropertyValue',
              name: 'art_id',
              value: 456,
            },
            {
              '@type': 'PropertyValue',
              name: 'item_id',
              value: 789,
            },
          ],
        },
      ],
      track: {
        itemListElement: [
          {
            position: 1,
            item: {
              additionalProperty: [
                {
                  '@type': 'PropertyValue',
                  name: 'track_id',
                  value: 111,
                },
              ],
              name: 'Example Artist - First Track',
              duration: 'PT1M30S',
              mainEntityOfPage:
                'https://example.bandcamp.com/track/first-track',
            },
          },
        ],
      },
    } as MusicAlbumSchema;

    const details = AlbumDetails.fromMusicAlbumSchema(schema);

    expect(details.url).toBe(
      'https://example.bandcamp.com/album/example-album',
    );
    expect(details.artist.toString()).toBe('Example Artist');
    expect(details.title).toBe('(CAT-001) Example Album (EP 2024)');
    expect(details.displayTitle).toBe(
      'Example Artist - (CAT-001) Example Album (EP 2024) (2024)',
    );
    expect(details.artwork.id).toBe(456);
    expect(details.tracks).toHaveLength(1);
    expect(details.tags).toEqual(['ambient', 'drone']);
    expect(details.publisher).toBe('Example Publisher');
    expect(details.publishedDate).toBe('2024-01-20');
    expect(details.modifiedDate).toBe('2024-02-21');
    expect(details.releaseMetadata.catalogNumber).toBe('CAT-001');
    expect(details.releaseMetadata.releaseTitle).toBe('Example Album');
    expect(details.releaseMetadata.releaseType).toBe('EP');
    expect(details.releaseMetadata.releaseYear).toBe(2024);
  });
});
