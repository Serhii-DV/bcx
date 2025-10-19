export class BandcampPageData {
  constructor(private data: any = null) {}

  /** Returns the album ID if available */
  get albumId(): number | null {
    return this.data?.album_id ?? null;
  }

  /** Optional: returns the track ID */
  get trackId(): number | null {
    return this.data?.id ?? null;
  }

  /** Optional: returns the title */
  get title(): string | null {
    return this.data?.title ?? null;
  }

  /** Check if the data exists */
  isAvailable(): boolean {
    return this.data !== null;
  }

  static fromJson(jsonString: string): BandcampPageData {
    const data = JSON.parse(jsonString);
    return new BandcampPageData(data);
  }
}
