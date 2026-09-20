import { describe, expect, it } from '@rstest/core';
import { Metadata } from '../metadata';
import type { MusicAlbumSchema } from '../page/schema';
import { Price } from '../price';
import { releaseNotesFromSchema } from './releaseNotes';

describe('release notes persistence', () => {
  it('round trips optional release notes through raw and compressed metadata', () => {
    const notes = {
      description: 'About the album',
      credits: 'Credits',
      artistUrl: 'https://artist.bandcamp.com/',
      publisherUrl: 'https://label.bandcamp.com/',
      releaseType: 'EP',
      priceAvailable: true,
      minimumPrice: 0,
    };
    const metadata = Metadata.create(
      Price.create(0, 'EUR'),
      'Label',
      '2026-01-01',
      '2026-01-01',
      ['ambient'],
      notes,
    );
    expect(Metadata.fromRawData(metadata.toRawData()).release).toEqual(notes);
    expect(
      Metadata.fromStorageObject(metadata.toStorageObject()).release,
    ).toEqual(notes);
  });

  it('continues to read older metadata without release notes', () => {
    const restored = Metadata.fromStorageObject({
      p: { a: 5, c: 'EUR' },
      b: 'Label',
      d: '2026-01-01',
      m: '2026-01-01',
      k: ['ambient'],
    });
    expect(restored.release).toBeUndefined();
    expect(restored.price.toString()).toBe('5 EUR');
    expect(restored.publisher).toBe('Label');
  });

  it('extracts notes and treats a missing digital offer as unavailable', () => {
    const schema = {
      description: '  Description  ',
      creditText: 'Credits',
      albumReleaseType: 'https://schema.org/EPRelease',
      byArtist: { '@id': 'https://artist.bandcamp.com/' },
      publisher: { '@id': 'javascript:bad' },
      albumRelease: [],
    } as unknown as MusicAlbumSchema;
    expect(releaseNotesFromSchema(schema)).toMatchObject({
      description: 'Description',
      credits: 'Credits',
      releaseType: 'EP',
      artistUrl: 'https://artist.bandcamp.com/',
      publisherUrl: undefined,
      priceAvailable: false,
    });
  });
});
