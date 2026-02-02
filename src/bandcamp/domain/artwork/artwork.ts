import { ArtworkSize } from './artworkSize';

export enum ArtworkType {
  Album = 'album',
  Band = 'band',
}

export class Artwork {
  constructor(
    public id: number,
    public type: ArtworkType = ArtworkType.Album,
  ) {}

  // Convenient getter properties for common sizes

  /**
   * Get tiny size URL (25x25)
   */
  public get tinySizeUrl(): string {
    return this.getUrl(ArtworkSize.TINY)!;
  }

  /**
   * Get small size URL (100x100)
   */
  public get smallSizeUrl(): string {
    return this.getUrl(ArtworkSize.SMALL)!;
  }

  /**
   * Get medium size URL (300x300)
   */
  public get mediumSizeUrl(): string {
    return this.getUrl(ArtworkSize.MEDIUM)!;
  }

  /**
   * Get large size URL (700x700)
   */
  public get largeSizeUrl(): string {
    return this.getUrl(ArtworkSize.LARGE)!;
  }

  /**
   * Get extra large size URL (1200x1200)
   */
  public get extraLargeSizeUrl(): string {
    return this.getUrl(ArtworkSize.EXTRA_LARGE)!;
  }

  /**
   * Get huge size URL (4000x4000)
   */
  public get hugeSizeUrl(): string {
    return this.getUrl(ArtworkSize.HUGE)!;
  }

  /**
   * Generate Bandcamp art URL for a specific size ID
   * @param sizeId - The size ID from ArtSize constants
   * @returns The complete Bandcamp art URL or null if size doesn't exist
   */
  public getUrl(sizeId: number): string | null {
    const sizeInfo = ArtworkSize.getById(sizeId);

    if (!sizeInfo) {
      return null;
    }

    const idPrefix = this.type === ArtworkType.Band ? '' : 'a';

    return `https://f4.bcbits.com/img/${idPrefix}${this.id}_${sizeId}.${sizeInfo.format}`;
  }
}
