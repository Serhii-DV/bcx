import { beforeEach, describe, expect, it } from '@rstest/core';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Band } from 'src/bandcamp/domain/band/band';
import { Url } from 'src/core/url';
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
    expect(sections[0].selectOnPageChange).toBe(true);
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
