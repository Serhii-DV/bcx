import type { StringCompressor } from '../compressor';

export class UrlCompressor implements StringCompressor {
  compress(url: string): string {
    return url
      .replace('https://', '')
      .replace('.bandcamp.com/', '')
      .replace('album/', '/a/')
      .replace('track/', '/t/');
  }

  decompress(compressed: string): string {
    const [subdomain, type, slug] = compressed.split('/');
    const fullType = type === 'a' ? 'album' : 'track';
    return `https://${subdomain}.bandcamp.com/${fullType}/${slug}`;
  }
}
