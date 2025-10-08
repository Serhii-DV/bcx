import { console } from 'src/utils/console';

console.log('Running background script');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed!');
});
