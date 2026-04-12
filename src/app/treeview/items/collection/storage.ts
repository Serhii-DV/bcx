import type { BandcampItem } from 'src/bandcamp/domain/page/PageCollection';
import { storage } from 'src/core/shared';

const COLLECTION_KEY = '/collection';

export async function loadCollectionItemsFromStorage(): Promise<
  BandcampItem[]
> {
  return (await storage.getByKey(COLLECTION_KEY)) || [];
}

export async function saveCollectionItemsToStorage(
  items: BandcampItem[],
): Promise<void> {
  await storage.set({ [COLLECTION_KEY]: items });
}
