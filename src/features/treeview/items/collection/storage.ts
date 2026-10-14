import {
  type FanAccount,
  readSavedItems,
  saveSnapshot,
} from 'src/bandcamp/domain/fanData/library';
import type { BandcampItem } from 'src/bandcamp/domain/page/PageCollection';

export async function loadCollectionItemsFromStorage(): Promise<
  BandcampItem[]
> {
  return readSavedItems('collection');
}

export async function saveCollectionItemsToStorage(
  items: BandcampItem[],
  account: FanAccount,
): Promise<void> {
  await saveSnapshot(account, 'collection', items);
}
