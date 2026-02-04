import type { Url } from 'src/core/url';
import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
  isBandcampTrackUrl,
} from './helper';

export class BandcampUrlFactory {
  static create(url: Url): Url {
    if (isBandcampMusicUrl(url)) {
      return BandcampUrlFactory.createBandUrl(url);
    } else if (isBandcampAlbumUrl(url)) {
      return BandcampUrlFactory.createAlbumUrl(url);
    } else if (isBandcampTrackUrl(url)) {
      return BandcampUrlFactory.createTrackUrl(url);
    }

    return url;
  }
  /**
   * Creates a band Url from the given Url.
   */
  static createBandUrl(url: Url): Url {
    return url.withoutPathAndSearchAndHash;
  }

  /**
   * Creates an album Url from the given Url.
   */
  static createAlbumUrl(url: Url): Url {
    return url.withoutSearchAndHash;
  }

  /**
   * Creates a track Url from the given Url.
   */
  static createTrackUrl(url: Url): Url {
    return url.withoutSearchAndHash;
  }
}
