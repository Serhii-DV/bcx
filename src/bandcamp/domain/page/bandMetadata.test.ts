import { describe, expect, it } from '@rstest/core';
import { BandMetadata } from '../band/metadata';
import { BandMetadataCompressor } from '../band/metadataCompressor';
import { readBandMetadata } from './bandMetadata';

const parse = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html');

describe('public band profile', () => {
  it('extracts location, full biography and unique safe publisher links', () => {
    const profile = readBandMetadata(
      parse(`
      <p id="band-name-location"><span class="location">Copenhagen, Denmark</span></p>
      <p id="bio-text">Independent <span class="peekaboo-text">record label.</span><span class="peekaboo-link">... more</span></p>
      <ol id="band-links">
        <li><a href="https://instagram.com/example">Instagram</a></li>
        <li><a href="https://instagram.com/example">Duplicate</a></li>
        <li><a href="javascript:alert(1)">Unsafe</a></li>
        <li><a href="/contact">Contact</a></li>
      </ol>`),
      'https://example.bandcamp.com',
    );
    expect(profile).toEqual({
      location: 'Copenhagen, Denmark',
      biography: 'Independent record label.',
      links: [
        { label: 'Instagram', url: 'https://instagram.com/example' },
        { label: 'Contact', url: 'https://example.bandcamp.com/contact' },
      ],
    });
    if (!profile) throw new Error('Expected a profile from the fixture');
    const metadata = BandMetadata.create(
      '2020-01-01',
      'EUR',
      [],
      [],
      profile.location,
      profile.biography,
      profile.links,
    );
    expect(
      BandMetadata.fromStorageObject(metadata.toStorageObject()),
    ).toMatchObject(profile);
  });

  it('distinguishes a missing sidebar from an empty profile', () => {
    expect(
      readBandMetadata(parse(''), 'https://example.bandcamp.com'),
    ).toBeUndefined();
    expect(
      readBandMetadata(
        parse('<p id="band-name-location"></p>'),
        'https://example.bandcamp.com',
      ),
    ).toEqual({ location: undefined, biography: undefined, links: [] });
    expect(
      new BandMetadataCompressor().decompress({ c: '2020-01-01', r: 'EUR' }),
    ).toMatchObject({ location: undefined, biography: undefined, links: [] });
  });
});
