import { Storage } from './storage';

/**
 * Shared storage instance for use across content scripts
 * This ensures we have a single storage instance throughout the application
 */
export const storage = new Storage();
