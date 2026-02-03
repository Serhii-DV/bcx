import { v5 as uuid5 } from 'uuid';

export class Url extends URL {
  static create(url: string): Url {
    try {
      return new Url(url);
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  static fromHistoryItem(item: chrome.history.HistoryItem): Url | null {
    if (!item.url) {
      return null;
    }

    try {
      return new Url(item.url);
    } catch {
      return null;
    }
  }

  /**
   * Generates a UUIDv5 based on the URL string.
   * @throws Error if the UUID cannot be generated
   */
  get uuid(): string {
    const uuid = uuid5(this.toString(), uuid5.URL);
    if (!uuid) {
      throw new Error('URL UUID is undefined for URL: ' + this.toString());
    }
    return uuid;
  }

  /**
   * Returns the subdomain of the URL's hostname or an empty string if none exists.
   *
   * Examples:
   * https://subdomain.domain.com -> subdomain
   * https://domain.com -> (empty string)
   */
  get subdomain(): string {
    const parts = this.hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(0, -2).join('.');
    }
    return '';
  }

  /**
   * Returns the URL string without the protocol.
   *
   * Examples:
   * https://subdomain.bandcamp.com/path?query=1#hash -> subdomain.bandcamp.com/path?query=1#hash
   */
  get withoutProtocol(): string {
    return `${this.hostname}${this.pathname}${this.search}${this.hash}`;
  }

  /**
   * Gets and decodes the value of a search parameter by name.
   */
  getSearchParam(name: string): string | null {
    const value = this.searchParams.get(name);
    return value ? decodeURIComponent(value.replace(/\+/g, ' ')) : null;
  }

  /**
   * Returns the URL without search.
   *
   * Examples:
   * https://subdomain.domain.com/path?query=1#hash -> https://subdomain.domain.com/path#hash
   */
  get withoutSearch(): Url {
    return new Url(
      `${this.protocol}//${this.hostname}${this.pathname}${this.hash}`,
    );
  }

  /**
   * Returns the hostname and pathname of the URL.
   *
   * Examples:
   * https://subdomain.domain.com/path?query=1#hash -> https://subdomain.domain.com/path
   */
  get withoutSearchAndHash(): Url {
    return new Url(`${this.protocol}//${this.hostname}${this.pathname}`);
  }

  /**
   * Returns the protocol and hostname of the URL.
   *
   * Examples:
   * https://subdomain.domain.com/path -> https://subdomain.domain.com/
   */
  get withoutPathAndSearchAndHash(): Url {
    return new Url(`${this.protocol}//${this.hostname}`);
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

    return new Url(`${this.protocol}//${this.hostname}${newPath}`);
  }
}
