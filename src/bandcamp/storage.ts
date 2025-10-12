import { storage } from 'src/core/shared';
import type { StorageObject } from 'src/core/storage';
import { Band } from './band/band';
import { BandFactory } from './band/factory';
import { StorageKey } from './storageKey';
import type { Track } from './track/track';

export class BandcampStorage {
  static async saveBand(band: Band): Promise<void> {
    const bandIds: number[] = await this.getBandsIds();

    // Add the current band ID if it's not already in the array
    if (!bandIds.includes(band.id)) {
      bandIds.push(band.id);
      await storage.set(StorageKey.bandsKey(), bandIds);
    }

    await storage.set(band);
  }

  static async getBands(): Promise<Band[]> {
    const bandIds: number[] = await this.getBandsIds();

    if (bandIds.length === 0) {
      return [];
    }

    // Prepare all keys to load in one storage call
    const bandKeys: string[] = bandIds.map((id) => StorageKey.bandKey(id));

    // Load all band data in single call
    const bandsData = await storage.get(bandKeys);

    // Collect album keys from loaded band data
    const albumKeys: string[] = [];
    for (const bandKey of bandKeys) {
      const objBand = bandsData[bandKey];
      objBand?.albums.forEach((albumId: number) => {
        const albumKey = StorageKey.albumKey(albumId);
        if (albumKeys.includes(albumKey)) return;
        albumKeys.push(albumKey);
      });
    }

    // Load album data if needed
    const albumData = albumKeys.length
      ? await storage.get(Array.from(albumKeys))
      : {};

    // Create bands from loaded data
    const bands: Band[] = [];
    bandKeys.forEach((bandKey) => {
      const objBand = bandsData[bandKey];
      if (!objBand) return;
      const band = this.createBandFromStorageObject(objBand, albumData);
      if (!band) return;

      bands.push(band);
    });

    return bands;
  }

  private static createBandFromStorageObject(
    bandObj: any,
    albumsObj: { [key: string]: any },
  ): Band | null {
    if (!bandObj || typeof bandObj !== 'object') {
      return null;
    }

    const albumIds: number[] = bandObj.albums || [];
    if (albumIds.length === 0) {
      return BandFactory.fromStorage(bandObj, [], []);
    }

    const albumObjs: StorageObject[] = [];
    albumIds.forEach((albumId) => {
      const albumKey = StorageKey.albumKey(albumId);
      const albumObj = albumsObj[albumKey];
      if (!albumObj) return;
      albumObjs.push(albumObj);
    });

    const trackObjs: StorageObject[] = [];
    if (bandObj.tracks && Array.isArray(bandObj.tracks)) {
      bandObj.tracks.forEach((trackId: number) => {
        const trackKey = StorageKey.trackKey(trackId);
        const trackObj = albumsObj[trackKey];
        if (!trackObj) return;
        trackObjs.push(trackObj);
      });
    }

    return BandFactory.fromStorage(bandObj, albumObjs, trackObjs);
  }

  private static async getBandsIds(): Promise<number[]> {
    const bandsKey = StorageKey.bandsKey();
    const bandIds: number[] =
      (await storage.getByKey<number[]>(bandsKey)) || [];
    return bandIds;
  }

  static async saveTrack(track: Track): Promise<void> {
    await storage.set(track).catch((reason) => {
      throw new Error(reason);
    });
  }
}
