import { console } from 'src/utils/console';
import { History } from './core/history';
import { type Message, MessageType } from './core/message';

console.log('Running background script');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed!');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    if (message.type === MessageType.HISTORY_SEARCH) {
      History.search(message.query)
        .then((results) => {
          sendResponse({ results });
        })
        .catch((error) => {
          console.error('History search failed:', error);
          sendResponse({ error: error.message });
        });

      // Return true to indicate async response
      return true;
    }
  },
);
