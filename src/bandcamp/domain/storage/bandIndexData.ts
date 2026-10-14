import { BandcampStorage } from '../storage';

type BandMapType = Record<string, number>;

/** Derived compatibility view; IndexedDB maintains the actual name index. */
export class BandIndexData {
  static async load(): Promise<BandMapType> {
    const bands = await BandcampStorage.getAllCompressedBandData();
    return Object.fromEntries(bands.map((band) => [band.n, band.i]));
  }

  static async getBandsIds(): Promise<number[]> {
    const bands = await BandcampStorage.getAllCompressedBandData();
    return bands.map((band) => band.i);
  }

  static async refresh(): Promise<BandMapType> {
    return this.load();
  }
}
