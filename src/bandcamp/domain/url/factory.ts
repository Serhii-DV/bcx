import type { Url } from 'src/core/url';

export class BandcampUrlFactory {
  /**
   * Creates a band Url from the given Url.
   */
  static bandUrl(url: Url): Url {
    return url.withoutPathAndSearchAndHash;
  }
}
