import { writable } from 'svelte/store';

export const DEFAULT_RELEASE_PREVIEW_SIZE = 45;
export const MIN_RELEASE_PREVIEW_SIZE = 20;
export const MAX_RELEASE_PREVIEW_SIZE = 80;

export const releasePreviewSize = writable(DEFAULT_RELEASE_PREVIEW_SIZE);
