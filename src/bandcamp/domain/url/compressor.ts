import { Url } from 'src/core/url';
import type { StringCompressor } from '../compressor';
import { BandcampUrlFactory } from './factory';

export class UrlCompressor implements StringCompressor {
  compress(url: string): string {
    return url
      .replace('https://', '')
      .replace('.bandcamp.com/', '')
      .replace('music/', '')
      .replace('album/', '/a/')
      .replace('track/', '/t/');
  }

  decompress(compressed: string): string {
    const [subdomain, type, slug] = compressed.split('/');
    const fullType = type === 'a' ? 'album' : 'track';
    const path = slug ? `/${fullType}/${slug}` : '';
    const url = Url.create(`https://${subdomain}.bandcamp.com${path}`);

    return BandcampUrlFactory.create(url).toString();
  }
}
