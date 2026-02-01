export enum MessageType {
  HISTORY_SEARCH = 'HISTORY_SEARCH',
}

export interface Message {
  type: MessageType;
  query: chrome.history.HistoryQuery;
}
