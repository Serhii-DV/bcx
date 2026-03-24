import { storage } from "src/core/shared";
import { StorageKey } from "../storageKey";

type BandMapType = Record<string, number>;

export class BandIndexData {
  static async save(bandMap: BandMapType): Promise<BandMapType> {
    const bandsKey = StorageKey.bandsKey();
    await storage.set(bandsKey, bandMap);
    return bandMap;
  }

  static async set(bandId: number, bandName: string): Promise<BandMapType> {
    const bandMap = await this.load();
    bandMap[bandName] = bandId;
    return await this.save(bandMap);
  }

  static async load(): Promise<BandMapType> {
    const bandsKey = StorageKey.bandsKey();
    const bandMap: BandMapType =
      (await storage.getByKey<BandMapType>(bandsKey)) || {};
    return bandMap;
  }

  static async getBandsIds(): Promise<number[]> {
    const bandMap = await this.load();
    return Object.values(bandMap);
  }
}
