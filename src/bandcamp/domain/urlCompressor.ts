export class UrlCompressor {
  static compress(url: string): string {
    return url
      .replace('https://', '')
      .replace('.bandcamp.com/', '')
      .replace('album/', '/a/')
      .replace('track/', '/t/');
  }

  static expand(compressed: string): string {
    const [subdomain, type, slug] = compressed.split('/');
    const fullType = type === 'a' ? 'album' : 'track';
    return `https://${subdomain}.bandcamp.com/${fullType}/${slug}`;
  }
}
