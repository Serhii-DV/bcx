import { Url } from 'src/bandcamp/domain/url';
import { Storage } from './storage';

/**
 * Shared storage instance for use across content scripts
 */
export const storage = new Storage();

/**
 * Shared current URL instance for use across content scripts
 */
export const currentPageUrl = new Url(window.location.href);

export const MUSIC_FILTER_QUERY_PARAM = 'q';
