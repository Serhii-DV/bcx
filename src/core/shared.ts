import { Storage } from './storage';
import { Url } from './url';

/**
 * Shared storage instance for use across content scripts
 */
export const storage = new Storage();

/**
 * Shared current URL instance for use across content scripts
 */
export const currentPageUrl = Url.create(window.location.href);

export const MUSIC_FILTER_QUERY_PARAM = 'q';
