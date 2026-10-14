import { type Message, MessageType } from 'src/core/message';
import type { FanAccount, FanDataset } from '../domain/fanData/data';
import type { BandcampResponseCapture } from '../domain/page/PageCollection';

const PREFIX = '/debug/fan-sync/';
let lastRunAt = 0;

// Forward to the worker console because Sync closes its temporary content tab.
async function logCapture(
  label: string,
  metadata: Record<string, unknown>,
  data: unknown,
): Promise<void> {
  try {
    const result: unknown = await chrome.runtime.sendMessage({
      type: MessageType.LOG_FAN_SYNC_DEBUG,
      label,
      capture: { ...metadata, data },
    } satisfies Message);
    if (
      !result ||
      typeof result !== 'object' ||
      !('ok' in result) ||
      result.ok !== true
    )
      throw new Error(
        'The background worker did not acknowledge the debug log.',
      );
  } catch (error) {
    console.warn('BCX could not log fan-sync debug data:', error);
  }
}

export function captureFanPageData(
  account: FanAccount,
  data: unknown,
): Promise<void> {
  return logCapture(
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
    return logCapture(
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
