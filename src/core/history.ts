import { arrayPreview, console } from '../utils/console';
import { type Message, MessageType } from './message';

export class History {
  static async search(
    query: chrome.history.HistoryQuery,
  ): Promise<chrome.history.HistoryItem[]> {
    console.log('[History.search]', query);

    // Check if we're in a context where chrome.history is available
    if (typeof chrome !== 'undefined' && chrome.history) {
      return historySearch(query).then((results) => {
        console.log('[History.search]', ...arrayPreview(results));
        return results;
      });
    }

    // If not available (e.g., in content script), use message passing
    return new Promise((resolve, reject) => {
      const message: Message = { type: MessageType.HISTORY_SEARCH, query };
      console.log('[History.search]', 'sending message', message);
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Failed to send history search message:',
            chrome.runtime.lastError,
          );
          return reject(chrome.runtime.lastError);
        }
        if (response.error) {
          return reject(new Error(response.error));
        }
        console.log('[History.search]', ...arrayPreview(response.results));
        resolve(response.results);
      });
    });
  }
}

function historySearch(
  query: chrome.history.HistoryQuery,
): Promise<chrome.history.HistoryItem[]> {
  return new Promise((resolve, reject) => {
    chrome.history.search(query, (results) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Cannot retrieve history for query:',
          query,
          chrome.runtime.lastError,
        );
        return reject(chrome.runtime.lastError);
      }
      resolve(results);
    });
  });
}
