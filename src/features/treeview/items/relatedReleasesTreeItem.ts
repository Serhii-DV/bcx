import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { releaseLink } from 'src/bandcamp/domain/album/releaseNotes';
import { Artist, isVariousArtists } from 'src/bandcamp/domain/artist/artist';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { getSavedArtistReleases } from '../savedPreviewLibrary';
import type { TreeItem } from '../TreeItem';
import { items, text } from '../TreeItemBuilder';
import { ICON_DISC, ICON_EXTERNAL_LINK } from '../utils/icon';
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';

const LABEL = 'Related releases';

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

function pageUrl(value?: string): URL | undefined {
  const href = releaseLink(value);
  if (!href) return undefined;
  const url = new URL(href);
  url.protocol = 'https:';
  url.search = '';
  url.hash = '';
  return url;
}

export async function loadRelatedArtistReleases(
  artists: readonly string[],
  releaseUrl?: string,
): Promise<TreeItem> {
  const currentUrl = pageUrl(releaseUrl);
  const artistNames = new Set(
    artists.map(normalize).filter((name) => name && !isVariousArtists(name)),
  );
  const seen = new Set(currentUrl ? [currentUrl.href] : []);
  const saved = await getSavedArtistReleases([...artistNames]);
  const albums = saved.flatMap((album) => {
    const url = pageUrl(album.url);
    if (!url?.pathname.startsWith('/album/') || seen.has(url.href)) return [];
    const sameArtist = [album.artist, ...Artist.parse(album.artist).names]
      .map(normalize)
      .some((name) => artistNames.has(name));
    if (!sameArtist) return [];
    seen.add(url.href);
    return [AlbumFactory.fromRawData({ ...album, url: url.href })];
  });
  return albums.length
    ? createPagedReleasesTreeItem({
        albums,
        label: LABEL,
        errorContext: '[Related releases]',
        withPreview: true,
        createPreviewItem: (album) => ({
          ...AlbumTreeItemFactory.createWithPreview(album, undefined, {
            showReleaseDate: true,
          }),
          buttons: undefined,
          actionIcon: ICON_EXTERNAL_LINK,
          hint: `Open release on Bandcamp\n${album.url}`,
        }),
      })
    : items(LABEL, [
        text('No other saved releases by this artist or these artists.'),
      ])
        .withImage(ICON_DISC)
        .withoutChildrenCount()
        .build();
}
