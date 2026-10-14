import { getErrorMessage } from 'src/utils/getErrorMessage';
import type { FanAccount, FanDataset } from '../domain/fanData/data';
import type { BandcampResponseCapture } from '../domain/page/PageCollection';

const PREFIX = '/debug/fan-sync/';
let lastRunAt = 0;

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
      // Record failure status at this key, leaving other captures and session data intact.
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
  // Keep runs distinct even when started within the same millisecond.
  const runAt = Math.max(Date.now(), lastRunAt + 1);
  lastRunAt = runAt;
  const runId = new Date(runAt).toISOString();
  let page = 0;
  return (capture: BandcampResponseCapture): Promise<void> => {
    const responseNumber = ++page;
    return saveCapture(
      `${PREFIX}${dataset}/${runId}/${String(responseNumber).padStart(4, '0')}`,
      {
        capturedAt: new Date().toISOString(),
        fanId: account.fanId,
        dataset,
        pageUrl: location.href,
        runId,
        page: responseNumber,
        endpoint: capture.endpoint,
        method: capture.method,
        request: capture.request,
      },
      capture.response,
    );
  };
}
