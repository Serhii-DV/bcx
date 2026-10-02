import { console } from 'src/utils/console';
import { captureStorageHistory, STORAGE_HISTORY_KEY } from './storageHistory';

const PERIODIC_ALARM = 'storage-history-periodic';
const CHANGE_ALARM = 'storage-history-changed';

export function initializeStorageHistory(): void {
  const report = (error: unknown) => console.error('Storage history:', error);
  if (!chrome.alarms) {
    report(
      new Error(
        'Alarms are unavailable. Reload the extension to enable storage history.',
      ),
    );
    return;
  }
  let scheduling = Promise.resolve();

  chrome.runtime.onStartup.addListener(() => {
    void captureStorageHistory().catch(report);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (!['local', 'session', 'sync'].includes(area)) return;
    if (Object.keys(changes).every((key) => key === STORAGE_HISTORY_KEY))
      return;
    // A persistent alarm batches bursts and survives worker suspension.
    scheduling = scheduling
      .then(async () => {
        if (!(await chrome.alarms.get(CHANGE_ALARM))) {
          await chrome.alarms.create(CHANGE_ALARM, { delayInMinutes: 0.5 });
        }
      })
      .catch(report);
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === PERIODIC_ALARM || alarm.name === CHANGE_ALARM) {
      void captureStorageHistory().catch(report);
    }
  });

  // Alarms can disappear across browser restarts. Check on every worker start.
  void (async () => {
    if (!(await chrome.alarms.get(PERIODIC_ALARM))) {
      await chrome.alarms.create(PERIODIC_ALARM, { periodInMinutes: 60 });
    }
    await captureStorageHistory(true);
  })().catch(report);
}
