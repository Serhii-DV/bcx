import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { Url } from 'src/core/url';

export function createItemUrl(value?: string): Url | undefined {
  if (!value) return undefined;
  try {
    const url = Url.create(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    url.protocol = 'https:';
    return BandcampUrlFactory.create(url);
  } catch {
    return undefined;
  }
}
