export interface ArtworkSizeInfo {
  readonly id: number;
  readonly width: number;
  readonly height: number;
  readonly format: 'jpg' | 'png';
}

export class ArtworkSize {
  private static readonly sizes: ReadonlyMap<number, ArtworkSizeInfo> = new Map(
    [
      [1, { id: 1, width: 4000, height: 4000, format: 'png' }],
      [2, { id: 2, width: 350, height: 350, format: 'jpg' }],
      [3, { id: 3, width: 100, height: 100, format: 'jpg' }],
      [4, { id: 4, width: 300, height: 300, format: 'jpg' }],
      [5, { id: 5, width: 700, height: 700, format: 'jpg' }],
      [6, { id: 6, width: 100, height: 100, format: 'jpg' }],
      [7, { id: 7, width: 150, height: 150, format: 'jpg' }],
      [8, { id: 8, width: 124, height: 124, format: 'jpg' }],
      [9, { id: 9, width: 210, height: 210, format: 'jpg' }],
      [10, { id: 10, width: 1200, height: 1200, format: 'jpg' }],
      [11, { id: 11, width: 172, height: 172, format: 'jpg' }],
      [12, { id: 12, width: 138, height: 138, format: 'jpg' }],
      [13, { id: 13, width: 380, height: 380, format: 'jpg' }],
      [14, { id: 14, width: 368, height: 368, format: 'jpg' }],
      [15, { id: 15, width: 135, height: 135, format: 'jpg' }],
      [16, { id: 16, width: 700, height: 700, format: 'jpg' }],
      [20, { id: 20, width: 1024, height: 1024, format: 'jpg' }],
      [21, { id: 21, width: 120, height: 120, format: 'jpg' }],
      [22, { id: 22, width: 25, height: 25, format: 'jpg' }],
      [23, { id: 23, width: 300, height: 300, format: 'jpg' }],
      [24, { id: 24, width: 300, height: 300, format: 'jpg' }],
      [25, { id: 25, width: 700, height: 700, format: 'jpg' }],
      [31, { id: 31, width: 1024, height: 1024, format: 'png' }],
      [41, { id: 41, width: 210, height: 210, format: 'jpg' }],
      [50, { id: 50, width: 140, height: 140, format: 'jpg' }],
      [70, { id: 70, width: 270, height: 270, format: 'jpg' }],
      [71, { id: 71, width: 540, height: 540, format: 'jpg' }],
      [101, { id: 101, width: 90, height: 90, format: 'jpg' }],
      [200, { id: 200, width: 420, height: 420, format: 'jpg' }],
    ],
  );

  // Common size constants for easy access
  public static readonly TINY = 22; // 25x25
  public static readonly SMALL = 3; // 100x100
  public static readonly MEDIUM = 4; // 300x300
  public static readonly LARGE = 5; // 700x700
  public static readonly EXTRA_LARGE = 10; // 1200x1200
  public static readonly HUGE = 1; // 4000x4000

  /**
   * Get art size information by ID
   */
  public static getById(id: number): ArtworkSizeInfo | undefined {
    return this.sizes.get(id);
  }

  /**
   * Get all available art sizes
   */
  public static getAll(): ArtworkSizeInfo[] {
    return Array.from(this.sizes.values());
  }

  /**
   * Get all available size IDs
   */
  public static getIds(): number[] {
    return Array.from(this.sizes.keys());
  }

  /**
   * Find the closest size ID to the given dimensions
   */
  public static findClosestSize(
    targetWidth: number,
    targetHeight: number,
  ): number {
    const targetArea = targetWidth * targetHeight;
    let closestId = 1;
    let closestDiff = Number.MAX_VALUE;

    for (const [id, info] of this.sizes) {
      const area = info.width * info.height;
      const diff = Math.abs(area - targetArea);

      if (diff < closestDiff) {
        closestDiff = diff;
        closestId = id;
      }
    }

    return closestId;
  }

  /**
   * Get sizes by format
   */
  public static getByFormat(format: 'jpg' | 'png'): ArtworkSizeInfo[] {
    return Array.from(this.sizes.values()).filter(
      (size) => size.format === format,
    );
  }

  /**
   * Get sizes within a range
   */
  public static getSizesInRange(
    minWidth: number,
    maxWidth: number,
  ): ArtworkSizeInfo[] {
    return Array.from(this.sizes.values()).filter(
      (size) => size.width >= minWidth && size.width <= maxWidth,
    );
  }

  /**
   * Check if a size ID exists
   */
  public static exists(id: number): boolean {
    return this.sizes.has(id);
  }

  /**
   * Get the largest available size
   */
  public static getLargest(): ArtworkSizeInfo {
    return this.sizes.get(this.HUGE)!;
  }

  /**
   * Get the smallest available size
   */
  public static getSmallest(): ArtworkSizeInfo {
    return this.sizes.get(this.TINY)!;
  }
}
