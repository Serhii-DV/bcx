export enum MessageType {
  HISTORY_SEARCH = 'HISTORY_SEARCH',
  GET_ACTIVE_BANDCAMP_TAB = 'GET_ACTIVE_BANDCAMP_TAB',
  GET_ACTIVE_BANDCAMP_PAGE_DATA = 'GET_ACTIVE_BANDCAMP_PAGE_DATA',
  APPLY_MUSIC_FILTER_QUERY = 'APPLY_MUSIC_FILTER_QUERY',
  OPEN_ACTIVE_TAB_URL = 'OPEN_ACTIVE_TAB_URL',
  TOGGLE_SIDE_PANEL = 'TOGGLE_SIDE_PANEL',
}

export interface HistorySearchMessage {
  type: MessageType.HISTORY_SEARCH;
  query: chrome.history.HistoryQuery;
}

export interface GetActiveBandcampTabMessage {
  type: MessageType.GET_ACTIVE_BANDCAMP_TAB;
}

export interface GetActiveBandcampPageDataMessage {
  type: MessageType.GET_ACTIVE_BANDCAMP_PAGE_DATA;
}

export interface ApplyMusicFilterQueryMessage {
  type: MessageType.APPLY_MUSIC_FILTER_QUERY;
  query: string;
}

export interface OpenActiveTabUrlMessage {
  type: MessageType.OPEN_ACTIVE_TAB_URL;
  url: string;
}

export interface ToggleSidePanelMessage {
  type: MessageType.TOGGLE_SIDE_PANEL;
  tabId?: number;
}

export type Message =
  | HistorySearchMessage
  | GetActiveBandcampTabMessage
  | GetActiveBandcampPageDataMessage
  | ApplyMusicFilterQueryMessage
  | OpenActiveTabUrlMessage
  | ToggleSidePanelMessage;
