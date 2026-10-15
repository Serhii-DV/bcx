import type { RawMetadataData } from '../metadata';
import type { MusicBatch } from '../storage/musicLibraryProtocol';
import type { FanItem } from './data';

export function musicFromFanItems(items: FanItem[]): MusicBatch {
  const batch: MusicBatch = { albums: [], tracks: [] };
  for (const item of items) {
    if (!('tralbum_id' in item)) continue;
    const currency =
      typeof item.currency === 'string'
        ? item.currency.trim().toUpperCase()
        : '';
    const metadata: RawMetadataData | undefined =
      typeof item.price === 'number' &&
      Number.isFinite(item.price) &&
      item.price >= 0 &&
      /^[A-Z]{3}$/.test(currency)
        ? {
            price: { amount: item.price, currency },
            // Fan-list timestamps describe membership, not release dates.
            publisher: '',
            published: '',
            modified: '',
            keywords: [],
          }
        : undefined;
    const summary = {
      id: item.tralbum_id,
      url: item.item_url,
      artist: item.band_name,
      title: item.item_title,
      artworkId:
        Number.isSafeInteger(item.item_art_id) && item.item_art_id >= 0
          ? item.item_art_id
          : 0,
      metadata,
    };
    if (item.tralbum_type === 'a') {
      batch.albums?.push({ ...summary, bandId: item.band_id, trackIds: [] });
    } else {
      batch.tracks?.push({
        ...summary,
        position: 0,
        albumId:
          Number.isSafeInteger(item.album_id) && item.album_id > 0
            ? item.album_id
            : undefined,
      });
    }
  }
  return batch;
}
