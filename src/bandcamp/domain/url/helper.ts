import type { Url } from 'src/core/url';

const bandcampHost = 'bandcamp.com';

export function isBandcampUrl(url: Url): boolean {
  return url.hostname.endsWith(bandcampHost);
}

export function isBandcampRegularUrl(url: Url): boolean {
  return url.toString().startsWith('https://' + bandcampHost);
}

export function isBandcampMusicUrl(url: Url): boolean {
  const path = url.pathname;
  return url.subdomain !== '' && (path === '/' || path.startsWith('/music'));
}

export function isBandcampAlbumUrl(url: Url): boolean {
  const path = url.pathname;
  return url.subdomain !== '' && path.startsWith('/album/');
}

export function isBandcampTrackUrl(url: Url): boolean {
  const path = url.pathname;
  return url.subdomain !== '' && path.startsWith('/track/');
}

export function isBandcampFeedUrl(url: Url): boolean {
  const path = url.pathname;
  return path.endsWith('/feed');
}

export function isBandcampDiscoverUrl(url: Url): boolean {
  const path = url.pathname;
  return path.startsWith('/discover');
}
