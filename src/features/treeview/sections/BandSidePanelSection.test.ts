import { beforeEach, describe, expect, it } from '@rstest/core';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Band } from 'src/bandcamp/domain/band/band';
import { Metadata } from 'src/bandcamp/domain/metadata';
import { Price } from 'src/bandcamp/domain/price';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { Url } from 'src/core/url';
import { createRootSectionTabs } from 'src/features/bcx/components/rootSectionTabs';
import { MainSidePanelSections } from '../items/MainSidePanelSections';
import { TreeItemCache } from '../items/TreeItemCache';
import { TREE_ITEM_LAYOUT } from '../TreeItem';
import { BandSidePanelSection } from './BandSidePanelSection';

beforeEach(async () => {
  await chrome.storage.session.clear();
});

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

describe('Artist/Label release browser', () => {
  it('shows public profile details on catalog and release pages', async () => {
    const band = Band.create(9, 'Label', 'https://label.bandcamp.com', 1);
    Object.assign(band.metadata, {
      location: 'Paris, France',
      biography: 'Independent label.',
      links: [{ label: 'Website', url: 'https://example.com/' }],
    });
    for (const url of [band.url, album.url]) {
      const data = await BandSidePanelSection.create(
        band,
        url,
      )?.createTreeData();
      const about = data?.items.find((item) => item.label === 'About');
      expect(about?.children?.map((item) => item.label)).toContain(
        'Location: Paris, France',
      );
      expect(about?.children?.map((item) => item.label)).toContain(
        'Independent label.',
      );
      expect(
        about?.children?.find(
          (item) => item.label === 'Websites & social links',
        )?.children?.[0].href,
      ).toBe('https://example.com/');
    }
  });
  it('filters artist and year groups while preserving releases after cache restoration', async () => {
    const band = Band.create(9, 'Label', 'https://label.bandcamp.com', 1);
    const release = AlbumFactory.fromRawData(album.toRawData());
    release.metadata = Metadata.create(
      Price.create(0, 'USD'),
      '',
      '2026-01-01',
      '2026-01-01',
      [],
    );
    band.metadata.albums = [release];

    for (const url of [band.url, album.url, album.url]) {
      const data = await BandSidePanelSection.create(
        band,
        url,
      )?.createTreeData();
      const labels = data?.items.map((item) => item.label) ?? [];
      expect(labels.indexOf('Release years')).toBeGreaterThanOrEqual(0);
      expect(labels.indexOf('Release years')).toBeLessThan(
        labels.indexOf('About'),
      );
      for (const [rootLabel, query] of [
        ['Artists', 'Artist'],
        ['Release years', '2026'],
      ]) {
        const group = data?.items.find((item) => item.label === rootLabel)
          ?.children?.[0];
        expect(group?.query).toBe(query);
        expect(group?.children?.[0].href).toBe(album.url.toString());
        expect(group?.children?.[0].loadPreview).toBeDefined();
      }
    }
  });

  it('shows sorted unique release tags in their own subtab, including after cache restoration', async () => {
    const band = Band.create(9, 'Label', 'https://label.bandcamp.com', 1);
    const release = AlbumFactory.fromRawData(album.toRawData());
    release.metadata = Metadata.create(
      Price.create(0, 'USD'),
      '',
      '2026-01-01',
      '2026-01-01',
      ['techno', 'ambient', 'ambient'],
    );
    band.metadata.albums = [release, release];
    band.metadata.tracks = [
      TrackFactory.create(
        2,
        1,
        'Artist',
        'Track',
        1,
        undefined,
        undefined,
        1,
        Metadata.create(
          Price.create(0, 'USD'),
          '',
          '2026-01-01',
          '2026-01-01',
          ['dub', 'ambient'],
        ),
      ),
    ];
    for (const url of [
      Url.create('https://label.bandcamp.com/music'),
      album.url,
      album.url,
    ]) {
      const data = await BandSidePanelSection.create(
        band,
        url,
      )?.createTreeData();
      const tags = data?.items.filter((item) => item.label === 'Tags');
      expect(tags).toHaveLength(1);
      expect(tags?.[0].image).toBe('tags');
      expect(tags?.[0].children?.map((item) => item.label)).toEqual([
        'ambient',
        'dub',
        'techno',
      ]);
      expect(tags?.[0].children?.map((item) => item.childrenCount)).toEqual([
        2, 1, 1,
      ]);
      expect(
        tags?.[0].children?.every(
          (item) => !item.children && !item.hasChildren,
        ),
      ).toBe(true);
      expect(
        tags?.[0].children?.every(
          (item) => item.image === 'tag' && item.query === item.label,
        ),
      ).toBe(true);
      expect(
        createRootSectionTabs(data?.items ?? []).some(
          (tab) => tab.label === 'Tags (3)',
        ),
      ).toBe(true);
      const about = data?.items.find((item) => item.label === 'About');
      expect(
        about?.children?.some((item) =>
          ['Artists in catalog', 'Genres and tags'].includes(item.label ?? ''),
        ),
      ).toBe(false);
    }
  });

  it('shows an About profile even without releases or artwork', async () => {
    const band = Band.create(7, 'Label', 'https://label.bandcamp.com', 0);
    const data = await BandSidePanelSection.create(
      band,
      band.url,
    )?.createTreeData();
    const about = data?.items.find((item) => item.label === 'About');
    expect(about?.aboutProfile).toEqual({ name: 'Label', image: undefined });
    expect(
      createRootSectionTabs(data?.items ?? []).some(
        (tab) => tab.label === 'Tags',
      ),
    ).toBe(true);
    expect(
      about?.children?.some(
        (item) => item.label === 'Loaded catalog: 0 albums, 0 track releases',
      ),
    ).toBe(true);
  });

  it('refreshes About information and artwork after reading an older cached tree', async () => {
    const band = Band.create(8, 'Label', 'https://label.bandcamp.com', 123);
    band.metadata.albums = [album];
    await TreeItemCache.set(TreeItemCache.subtreeKey('band', 8), {
      children: [
        { label: 'About Label', children: [{ label: 'Old information' }] },
      ],
    });
    const data = await BandSidePanelSection.create(
      band,
      album.url,
    )?.createTreeData();
    const about = data?.items.filter((item) => item.label === 'About');
    expect(about).toHaveLength(1);
    expect(data?.items.some((item) => item.label === 'About Label')).toBe(
      false,
    );
    expect(about?.[0].aboutProfile?.image).toBe(band.artwork.mediumSizeUrl);
    expect(
      about?.[0].children?.some(
        (item) => item.label === 'Loaded catalog: 1 albums, 0 track releases',
      ),
    ).toBe(true);
    expect(
      about?.[0].children?.some((item) =>
        ['Artists in catalog', 'Genres and tags'].includes(item.label ?? ''),
      ),
    ).toBe(false);
  });

  it('replaces the standalone release tab and retains a release missing from the catalog', async () => {
    const band = Band.create(1, 'Artist', 'https://artist.bandcamp.com', 1);
    const sections = await MainSidePanelSections.create(
      album.url,
      { album, band, albumDetails: null },
      { includePageData: false },
    );
    expect(sections.map((section) => section.id)).toEqual([
      'band-1',
      'history',
    ]);
    expect(sections[0].defaultOpen).toBe(true);
    expect(sections[0].navigationUrls).toContain(album.url.toString());
    const data = await sections[0].createTreeData();
    const releases = data.items.find((item) => item.label === 'Releases');
    expect(releases?.children?.[0].href).toBe(album.url.toString());
    expect(releases?.children?.[0].loadPreview).toBeDefined();
    expect(band.metadata.albums).toHaveLength(0);
  });

  it('renders music-page releases in browser layout without drill-down children', async () => {
    const band = Band.create(1, 'Artist', 'https://artist.bandcamp.com', 1);
    band.metadata.albums = [album];
    const data = await BandSidePanelSection.create(
      band,
      Url.create('https://artist.bandcamp.com/music'),
    )?.createTreeData();
    const releases = data?.items.find((item) => item.label === 'Releases');
    expect(releases?.layout).toBe(TREE_ITEM_LAYOUT.BROWSER);
    expect(releases?.children?.[0].children).toBeUndefined();
    expect(releases?.children?.[0].loadPreview).toBeDefined();
  });

  it('restores runtime preview loaders even when the band subtree is cached', async () => {
    const band = Band.create(1, 'Artist', 'https://artist.bandcamp.com', 1);
    band.metadata.albums = [album];
    await TreeItemCache.set(TreeItemCache.subtreeKey('band', 1), {
      children: [{ label: 'Releases', children: [{ label: 'Old release' }] }],
    });
    const data = await BandSidePanelSection.create(
      band,
      album.url,
    )?.createTreeData();
    const releases = data?.items.find((item) => item.label === 'Releases');
    expect(releases?.children?.[0].href).toBe(album.url.toString());
    expect(releases?.children?.[0].loadPreview).toBeDefined();
  });
});

it('shows the full catalog and selects the current release without reordering', async () => {
  const band = Band.create(1, 'Artist', 'https://artist.bandcamp.com', 1);
  band.metadata.albums = Array.from({ length: 45 }, (_, index) =>
    AlbumFactory.fromRawData({
      ...album.toRawData(),
      id: index + 1,
      title: `Release ${index}`,
      url: `https://artist.bandcamp.com/album/release-${index}`,
    }),
  );
  const current = band.metadata.albums[30];
  const section = BandSidePanelSection.create(
    band,
    Url.create(`${current.url}?from=discover#tracks`),
  );
  const data = await section?.createTreeData();
  const releases = data?.items.find((item) => item.label === 'Releases');
  expect(releases?.initialSelectedHref).toBe(current.url.toString());
  expect(releases?.children?.[30].href).toBe(current.url.toString());
  expect(releases?.children?.[0].href).toBe(
    band.metadata.albums[0].url.toString(),
  );
  expect(releases?.children).toHaveLength(45);
  for (const url of [band.url, Url.create(`${band.url}/music`), current.url]) {
    const catalog = await BandSidePanelSection.create(
      band,
      url,
    )?.createTreeData();
    const root = catalog?.items.find((item) => item.label === 'Releases');
    expect(root?.children?.map((item) => item.href)).toEqual(
      band.metadata.albums.map((album) => album.url.toString()),
    );
    expect(
      root?.children?.every((item) => typeof item.loadPreview === 'function'),
    ).toBe(true);
  }
});
