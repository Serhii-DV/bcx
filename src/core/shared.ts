import { Storage } from './storage';
import { Url } from './url';

const isTestEnvironment =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
const debug = !isTestEnvironment;

/**
 * Shared storage instance for use across content scripts
 */
export const storage = new Storage(chrome.storage.local, debug);
export const sessionStorage = new Storage(chrome.storage.session, debug);

/**
 * Shared current URL instance for use across content scripts
 */
export const currentPageUrl = Url.create(window.location.href);

export const MUSIC_FILTER_QUERY_PARAM = 'q';
