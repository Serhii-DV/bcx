import { Album } from 'src/bandcamp/domain/album/album';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { Track } from 'src/bandcamp/domain/track/track';
import { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from 'src/features/treeview/factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from 'src/features/treeview/factories/BandTreeItemFactory';
import { TrackTreeItemFactory } from 'src/features/treeview/factories/TrackTreeItemFactory';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { createPinnedPage, type PinnedPage } from './pinnedNavigation';

export function pinnedPageFromItem(item?: TreeItem): PinnedPage | undefined {
  if (!item) return undefined;
  const band = item.bandPreview;
  const about = item.aboutProfile;
  const information = item.previewInformation;
  const url = band?.url ?? about?.url ?? item.href ?? item.id;
  if (!url) return undefined;
  return createPinnedPage(
    url,
    band?.name ?? about?.name ?? information?.title ?? item.label ?? '',
    information?.artist,
    band?.id ?? about?.id ?? item.entityId,
  );
}

export async function loadPinnedPage(
  page: PinnedPage,
): Promise<TreeItem | undefined> {
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
