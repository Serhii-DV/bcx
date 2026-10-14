import { describe, expect, it } from '@rstest/core';
import { BandMetadata } from './metadata';

const profile = {
  location: 'Paris, France',
  biography: 'Independent label.',
  links: [{ label: 'Website', url: 'https://example.com/' }],
};

describe('band metadata profile fields', () => {
  it('writes flat raw metadata and round-trips public fields', () => {
    const metadata = BandMetadata.create(
      '2020-01-01',
      'EUR',
      [],
      [],
      profile.location,
      profile.biography,
      profile.links,
    );
    expect(metadata).toMatchObject(profile);
    const raw = metadata.toRawData();
    expect(raw).toMatchObject(profile);
    expect(raw).not.toHaveProperty('profile');
    expect(BandMetadata.fromRawData(raw)).toMatchObject(profile);
  });

  it('reads saved nested raw profiles', () => {
    expect(
      BandMetadata.fromRawData({
        created: '2020-01-01',
        currency: 'EUR',
        albumIds: [],
        trackIds: [],
        profile,
      }),
    ).toMatchObject(profile);
  });

  it('defaults missing links and keeps an explicitly empty flat profile', () => {
    expect(BandMetadata.create('2020-01-01', 'EUR').links).toEqual([]);
    expect(
      BandMetadata.fromRawData({
        created: '2020-01-01',
        currency: 'EUR',
        albumIds: [],
        trackIds: [],
      }).links,
    ).toEqual([]);
    expect(
      BandMetadata.fromRawData({
        created: '2020-01-01',
        currency: 'EUR',
        albumIds: [],
        trackIds: [],
        location: '',
        biography: '',
        links: [],
        profile,
      }),
    ).toMatchObject({ location: '', biography: '', links: [] });
  });
});
