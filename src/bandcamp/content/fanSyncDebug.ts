import { getErrorMessage } from 'src/utils/getErrorMessage';
import type { FanAccount, FanDataset } from '../domain/fanData/data';
import type { BandcampResponseCapture } from '../domain/page/PageCollection';

const PREFIX = '/debug/fan-sync/';

/** Store objects directly so DevTools can expand their original JSON structure. */
async function saveCapture(
  key: string,
  metadata: Record<string, unknown>,
  data: unknown,
): Promise<void> {
  try {
    const value = { ...metadata, data };
    await chrome.storage.session.set({ [key]: value });
  } catch (error) {
    const message = getErrorMessage(error, 'Could not save debug capture.');
    console.warn('BCX fan-sync debug capture:', message);
    try {
      // Replace stale captures with an explicit status, leaving unrelated session data intact.
      await chrome.storage.session.remove(key);
      await chrome.storage.session.set({
        [key]: { ...metadata, error: message },
      });
    } catch (storageError) {
      console.warn('BCX could not record debug capture status:', storageError);
    }
  }
}

export function captureFanPageData(
  account: FanAccount,
  data: unknown,
): Promise<void> {
  return saveCapture(
    PREFIX + 'page-data',
    {
      capturedAt: new Date().toISOString(),
      fanId: account.fanId,
      pageUrl: location.href,
    },
    data,
  );
}

export function createFanResponseCapture(
  account: FanAccount,
  dataset: FanDataset,
) {
  let page = 0;
  return (capture: BandcampResponseCapture): Promise<void> =>
    saveCapture(
      PREFIX + dataset,
      {
        capturedAt: new Date().toISOString(),
        fanId: account.fanId,
        dataset,
        pageUrl: location.href,
        page: ++page,
        endpoint: capture.endpoint,
        method: capture.method,
        request: capture.request,
      },
      capture.response,
    );
}
