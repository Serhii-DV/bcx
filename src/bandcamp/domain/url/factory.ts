import { Url } from 'src/core/url';
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

  static generateBandUrlFromSubdomain(subdomain: string): string {
    return `https://${subdomain}.bandcamp.com/`;
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

  static generateFanUrl(username: string): string {
    return `https://bandcamp.com/${username}`;
  }

  static generateWishlistUrl(username: string): string {
    return `https://bandcamp.com/${username}/wishlist`;
  }

  static generateFeedUrl(username: string): string {
    return `https://bandcamp.com/${username}/feed`;
  }

  static generateLoginUrl(): string {
    return 'https://bandcamp.com/login';
  }

  static generateFollowingBandsUrl(username: string): string {
    return `https://bandcamp.com/${username}/following/artists_and_labels`;
  }

  static generateFollowingFansUrl(username: string): string {
    return `https://bandcamp.com/${username}/following/fans`;
  }

  static generateFollowingGenresUrl(username: string): string {
    return `https://bandcamp.com/${username}/following/genres`;
  }
}
