import { v5 as uuid5 } from 'uuid';

const bandcampHost = 'bandcamp.com';

export class Url extends URL {
  static parse(url: string | Url | URL): Url {
    let urlString: string;

    if (url instanceof Url) {
      urlString = url.toString();
    } else if (url instanceof URL) {
      urlString = url.toString();
    } else {
      urlString = url;
    }

    try {
      return new Url(urlString);
    } catch (error) {
      throw new Error(`Invalid URL: ${urlString}`);
    }
  }

  get uuid(): string | undefined {
    return uuid5(this.withoutSearchAndQuery, uuid5.URL);
  }

  /**
   * Returns the hostname and pathname of the URL.
   *
   * Examples:
   * https://subdomain.bandcamp.com/path?query=1#hash -> https://subdomain.bandcamp.com/path
   */
  get withoutSearchAndQuery(): string {
    return `${this.protocol}//${this.hostname}${this.pathname}`;
  }

  /**
   * Returns the protocol and hostname of the URL.
   *
   * Examples:
   * https://subdomain.bandcamp.com/path -> https://subdomain.bandcamp.com
   */
  get hostnameWithProtocol(): string {
    return `${this.protocol}//${this.hostname}`;
  }

  /**
   * Returns the base band URL.
   */
  get bandUrl(): Url {
    return new Url(this.hostnameWithProtocol);
  }

  /**
   * Returns the subdomain of the URL's hostname or an empty string if none exists.
   *
   * Examples:
   * https://subdomain.bandcamp.com -> subdomain
   * https://bandcamp.com -> (empty string)
   */
  get subdomain(): string {
    const parts = this.hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(0, -2).join('.');
    }
    return '';
  }

  /**
   * Returns the URL without the protocol.
   *
   * Examples:
   * https://subdomain.bandcamp.com/path?query=1#hash -> subdomain.bandcamp.com/path?query=1#hash
   */
  get withoutProtocol(): string {
    return `${this.hostname}${this.pathname}${this.search}${this.hash}`;
  }

  /**
   * Returns the URL without query parameters.
   *
   * Examples:
   * https://subdomain.bandcamp.com/path?query=1#hash -> https://subdomain.bandcamp.com/path#hash
   */
  get withoutSearch(): string {
    return `${this.hostname}${this.pathname}${this.hash}`;
  }

  /**
   * Gets and decodes the value of a query parameter by name.
   */
  getQueryParam(param: string): string | null {
    const value = this.searchParams.get(param);
    return value ? decodeURIComponent(value.replace(/\+/g, ' ')) : null;
  }

  get isBandcamp(): boolean {
    return this.toString().includes(bandcampHost);
  }

  get isRegular(): boolean {
    return this.toString().includes('https://' + bandcampHost);
  }

  get isMusic(): boolean {
    const path = this.pathname;
    return path === '/' || path.startsWith('/music');
  }

  get isAlbum(): boolean {
    return this.toString().includes(bandcampHost + '/album/');
  }

  get isTrack(): boolean {
    return this.toString().includes(bandcampHost + '/track/');
  }

  /**
   * Sets a new path for the URL while keeping the current protocol and hostname.
   * @param newPath The new path to set (should start with '/')
   * @returns A new Url instance with the updated path
   */
  withPath(newPath: string): Url {
    if (!newPath.startsWith('/')) {
      newPath = '/' + newPath;
    }

    return new Url(`${this.hostnameWithProtocol}${newPath}`);
  }
}
