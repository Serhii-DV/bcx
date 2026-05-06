import { describe, expect, it } from '@rstest/core';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandTreeItemFactory } from './BandTreeItemFactory';
import { DateTreeItemFactory } from './DateTreeItemFactory';
import { HistoryEntryTreeItemFactory } from './HistoryEntryTreeItemFactory';
import { TrackTreeItemFactory } from './TrackTreeItemFactory';

describe('tree item factories', () => {
  it('creates band link items when a band URL is available', () => {
    const band = Band.create(1, 'Air', 'https://air.bandcamp.com', 123);

    expect(BandTreeItemFactory.create(band)).toMatchObject({
      label: 'Air',
      href: 'https://air.bandcamp.com/',
    });
  });

  it('creates text band items when a band URL is unavailable', () => {
    const band = Band.create(1, 'Air', 'https://air.bandcamp.com', 123);
    Object.defineProperty(band, 'url', { value: undefined });

    const treeItem = BandTreeItemFactory.create(band);

    expect(treeItem).toMatchObject({
      label: 'Air',
      includeInFilterSuggestions: true,
    });
    expect(treeItem).not.toHaveProperty('href');
  });

  it('creates track items and batches many tracks', () => {
    const tracks = [
      createTrack('Alpha', 1, 'https://air.bandcamp.com/track/alpha'),
      createTrack('Beta', 2),
    ];

    expect(TrackTreeItemFactory.createMany(tracks)).toEqual([
      expect.objectContaining({
        label: '1. Alpha',
        href: 'https://air.bandcamp.com/track/alpha',
      }),
      expect.objectContaining({
        label: '2. Beta',
        includeInFilterSuggestions: true,
      }),
    ]);
  });

  it('formats dates as display-only tree items', () => {
    expect(
      DateTreeItemFactory.create(new Date('2024-02-03T00:00:00Z')),
    ).toEqual(
      expect.objectContaining({
        label: expect.stringContaining('2024'),
      }),
    );
  });

  it('creates history items with external link buttons only for valid URLs', () => {
    expect(
      HistoryEntryTreeItemFactory.create({
        id: '1',
        title: 'Album',
        url: 'https://air.bandcamp.com/album/moon-safari',
      }),
    ).toMatchObject({
      label: 'Album',
      href: 'https://air.bandcamp.com/album/moon-safari',
      includeInFilterSuggestions: false,
      buttons: [
        {
          title: 'Open\nhttps://air.bandcamp.com/album/moon-safari',
          href: 'https://air.bandcamp.com/album/moon-safari',
        },
      ],
    });

    expect(HistoryEntryTreeItemFactory.create({ id: '2' })).toMatchObject({
      label: 'No Title',
      href: undefined,
      buttons: [],
    });
  });
});

function createTrack(name: string, trackNumber: number, url?: string) {
  return {
    name,
    trackNumber,
    url: url ? new URL(url) : undefined,
    toAlbumTrackString() {
      return `${trackNumber}. ${name}`;
    },
  };
}
