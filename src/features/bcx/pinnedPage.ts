import { Album } from 'src/bandcamp/domain/album/album';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Artwork } from 'src/bandcamp/domain/artwork/artwork';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { Track } from 'src/bandcamp/domain/track/track';
import { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from 'src/features/treeview/factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from 'src/features/treeview/factories/BandTreeItemFactory';
import { TrackTreeItemFactory } from 'src/features/treeview/factories/TrackTreeItemFactory';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import {
  createPinnedPage,
  type PinnedPage,
  pinnedPageImage,
} from './pinnedNavigation';

export function pinnedPageFromItem(item?: TreeItem): PinnedPage | undefined {
  if (!item) return undefined;
  const band = item.bandPreview;
  const about = item.aboutProfile;
  const information = item.previewInformation;
  const url = band?.url ?? about?.url ?? item.href ?? item.id;
  if (!url) return undefined;
  const image = pinnedPageImage(
    band?.image ?? about?.image ?? item.previewImage ?? item.image,
  );
  const artwork = image ? Artwork.fromUrl(image) : undefined;
  return createPinnedPage(
    url,
    band?.name ?? about?.name ?? information?.title ?? item.label ?? '',
    information?.artist,
    band?.id ?? about?.id ?? item.entityId,
    artwork ? (artwork.id > 0 ? artwork.tinySizeUrl : undefined) : image,
  );
}

async function loadSavedPinnedPage(
  page: PinnedPage,
): Promise<Band | Album | Track | undefined> {
  let saved: Band | Album | Track | undefined;
  if (page.entityId) {
    if (page.kind === 'band')
      [saved] = await BandcampStorage.getBands([page.entityId]);
    else if (page.kind === 'release') {
      const raw = await BandcampStorage.getAlbumsRawDataByIds([page.entityId]);
      if (raw.length) saved = AlbumFactory.fromRawData(raw[0]);
    } else [saved] = await BandcampStorage.getTracksByTrackIds([page.entityId]);
  }
  if (!saved)
    [saved] = await BandcampStorage.getByUuids([Url.create(page.url).uuid]);
  return saved;
}

export async function loadPinnedPageImage(
  page: PinnedPage,
): Promise<string | undefined> {
  const saved = await loadSavedPinnedPage(page);
  const matchesKind =
    (page.kind === 'band' && saved instanceof Band) ||
    (page.kind === 'release' && saved instanceof Album) ||
    (page.kind === 'track' && saved instanceof Track);
  return matchesKind && saved.artwork.id > 0
    ? saved.artwork.tinySizeUrl
    : undefined;
}

export async function loadPinnedPage(
  page: PinnedPage,
): Promise<TreeItem | undefined> {
  const saved = await loadSavedPinnedPage(page);
  if (page.kind === 'band' && saved instanceof Band)
    return BandTreeItemFactory.createWithPreview(saved);
  if (page.kind === 'release' && saved instanceof Album) {
    const [album] = await BandcampStorage.getAlbums([saved]);
    return AlbumTreeItemFactory.createWithPreview(album ?? saved);
  }
  if (page.kind === 'track' && saved instanceof Track)
    return TrackTreeItemFactory.createWithPreview(saved);
  return undefined;
}
