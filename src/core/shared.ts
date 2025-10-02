import { Url } from 'src/bandcamp/url';
import { Storage } from './storage';

/**
 * Shared storage instance for use across content scripts
 */
export const storage = new Storage();

/**
 * Shared current URL instance for use across content scripts
 */
export const currentPageUrl = Url.current();
