import { Album } from 'src/bandcamp/domain/album/album';
import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import type { BandRelease } from 'src/bandcamp/domain/band/metadata';
import type { BandcampItem } from 'src/bandcamp/domain/page/PageCollection';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { Track } from 'src/bandcamp/domain/track/track';
import { console } from 'src/utils/console';

export async function loadFanReleases(
  items: BandcampItem[],
): Promise<BandRelease[]> {
  const releases = items.map((item) =>
    item.tralbum_type === 't'
      ? TrackFactory.create(
          item.tralbum_id,
          0,
          item.band_name,
          item.item_title,
          item.item_art_id,
          item.item_url,
          undefined,
          item.album_id || undefined,
        )
      : AlbumFactory.fromBandcampItem(item),
  );
  if (!releases.length) return releases;
  const saved = await BandcampStorage.getByUuids(
    releases.flatMap((release) => (release.url ? [release.url.uuid] : [])),
  ).catch((error) => {
    console.warn('[Release catalog] Stored metadata lookup failed:', error);
    return [];
  });
  const metadataByUrl = new Map<string | undefined, BandRelease['metadata']>();
  for (const release of saved) {
    if (release instanceof Album || release instanceof Track) {
      metadataByUrl.set(release.url?.uuid, release.metadata);
    }
  }
  for (const release of releases) {
    release.metadata = metadataByUrl.get(release.url?.uuid);
  }
  return releases;
}
