import { v5 as uuid5 } from 'uuid';

const bandcampHost = 'bandcamp.com';

export class Url {
  public url: URL;
  public uuid: string;

  constructor(url: string) {
    try {
      url = removeQueryParams(url);
      this.url = new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }

    if (!this.isBandcamp) {
      throw new Error(`Wrong Bandcamp URL: ${url}`);
    }

    this.uuid = uuid5(url, uuid5.URL);
  }

  get hostname(): string {
    return this.url.hostname;
  }

  /**
   * Returns the protocol and hostname of the URL.
   */
  get hostnameWithProtocol(): string {
    return `${this.url.protocol}//${this.url.hostname}`;
  }

  /**
   * Returns the base band URL.
   */
  get bandUrl(): Url {
    return new Url(this.hostnameWithProtocol);
  }

  /**
   * Returns the subdomain of the URL's hostname or an empty string if none exists.
   */
  get subdomain(): string {
    const parts = this.url.hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(0, -2).join('.');
    }
    return '';
  }

  /**
   * Returns the URL without the protocol.
   */
  get withoutProtocol(): string {
    return `${this.url.hostname}${this.url.pathname}${this.url.search}${this.url.hash}`;
  }

  /**
   * Returns the URL without query parameters.
   */
  get withoutQueryParams(): string {
    const urlCopy = new URL(this.url.toString());
    urlCopy.search = '';
    return urlCopy.toString();
  }

  /**
   * Returns the pathname of the URL.
   */
  get pathname(): string {
    return this.url.pathname;
  }

  get isBandcamp(): boolean {
    return isValidBandcampUrl(this.toString());
  }

  get isRegular(): boolean {
    return this.toString().includes('https://' + bandcampHost);
  }

  get isMusic(): boolean {
    const path = this.pathname;
    return path === '/' || path === '/music';
  }

  get isAlbum(): boolean {
    return this.toString().includes(bandcampHost + '/album/');
  }

  get isTrack(): boolean {
    return this.toString().includes(bandcampHost + '/track/');
  }

  /**
   * Returns the full URL as a string.
   * @returns The string representation of the URL.
   */
  toString(): string {
    return this.url.toString();
  }

  static current(): Url {
    return new Url(window.location.href);
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

export function isValidBandcampUrl(url: string): boolean {
  return url.includes(bandcampHost);
}

function removeQueryParams(url: string): string {
  const urlObj = new URL(url);
  urlObj.search = '';
  return urlObj.toString();
}
