import {
  isFanAccount,
  isFanDataset,
  validateItems,
} from '../domain/fanData/library';
import { PageCollection } from '../domain/page/PageCollection';

export async function loadFanData(account: unknown, dataset: unknown) {
  if (
    !isFanAccount(account) ||
    !(isFanDataset(dataset) || dataset === 'identity')
  )
    throw new Error('Invalid sync request.');
  const page = new PageCollection();
  const data = page.getPageData();
  if (
    location.hostname !== 'bandcamp.com' ||
    data?.fan_data?.fan_id !== account.fanId ||
    data?.current_fan?.fan_id !== account.fanId ||
    data?.fan_data?.username !== account.username
  ) {
    throw new Error(
      'Sign in to the requested Bandcamp account, then retry sync.',
    );
  }
  if (dataset === 'identity') return { ok: true };
  const options = {
    signal: AbortSignal.timeout(170000),
    includeSummaryFlags: false,
  };
  const items =
    dataset === 'collection'
      ? await page.loadCollectionItems(options)
      : dataset === 'wishlist'
        ? await page.loadWishlistItems(options)
        : dataset === 'following-bands'
          ? await page.loadFollowingBandsItems(options)
          : await page.loadFollowingGenresItems();
  validateItems(dataset, items);
  const count =
    data[(dataset.replaceAll('-', '_') + '_data') as keyof typeof data];
  if (
    !count ||
    typeof count !== 'object' ||
    !('item_count' in count) ||
    typeof count.item_count !== 'number' ||
    items.length !== count.item_count
  ) {
    throw new Error(
      `Incomplete ${dataset} data. Saved data is unchanged; retry sync.`,
    );
  }
  // Membership is known from the endpoint; do not treat a failed summary as false flags.
  if (dataset === 'collection' || dataset === 'wishlist') {
    for (const item of items) {
      if ('tralbum_id' in item) {
        item.isPurchased = dataset === 'collection';
        item.isWishlisted = dataset === 'wishlist';
      }
    }
  }
  return { ok: true, items };
}
