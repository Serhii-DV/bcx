import { storage } from 'src/core/shared';
import type { StorableData } from 'src/core/storage';
import { Album } from './album/album';
import { AlbumFactory } from './album/factory';
import { Band } from './band/band';
import { BandFactory } from './band/factory';
import { StorageKey } from './storageKey';
import { TrackFactory } from './track/factory';
import type { Track } from './track/track';

export class BandcampStorage {
  static async saveBand(band: Band): Promise<void> {
    const bandIds: number[] = await this.getBandsIds();

    // Add the current band ID if it's not already in the array
    if (!bandIds.includes(band.id)) {
      bandIds.push(band.id);
      await storage.set(StorageKey.bandsKey(), bandIds);
    }

    const storageData: StorableData = band.toStorableData();
    const albumData = await BandcampStorage.getAlbumsStorageData(
      band.metadata.albums,
    );

    // Add storable data for each album but only in case if it doesn't exist yet
    for (const album of band.metadata.albums) {
      const albumKey = StorageKey.albumKey(album.id);
      if (albumData[albumKey]) {
        continue; // Skip if album data already exists
      }

      const albumStorableData = album.toStorableData();
      Object.assign(storageData, albumStorableData);
    }

    await BandcampStorage.addTracksToStorageData(
      band.metadata.tracks,
      storageData,
    );

    return await storage.set(storageData);
  }

  static async getBands(): Promise<Band[]> {
    const bandIds: number[] = await this.getBandsIds();

    if (bandIds.length === 0) {
      return [];
    }

    const bandsData = await this.loadBandsStorableData(bandIds);

    // Collect release keys from loaded band data
    const releaseKeys: string[] = [];
    for (const key in bandsData) {
      if (typeof bandsData[key] !== 'object') {
        delete bandsData[key];
      }

      const objBand = bandsData[key];
      objBand?.metadata?.albums.forEach((albumId: number) => {
        const albumKey = StorageKey.albumKey(albumId);
        if (releaseKeys.includes(albumKey)) return;
        releaseKeys.push(albumKey);
      });
      objBand?.metadata?.tracks.forEach((trackId: number) => {
        const trackKey = StorageKey.trackKey(trackId);
        if (releaseKeys.includes(trackKey)) return;
        releaseKeys.push(trackKey);
      });
    }

    // Load releases data if needed
    const releaseObjs = releaseKeys.length
      ? await storage.get(Array.from(releaseKeys))
      : {};

    // Create bands from loaded data
    const bands: Band[] = [];

    for (const key in bandsData) {
      if (typeof bandsData[key] !== 'object') {
        continue;
      }

      const objBand = bandsData[key];
      if (!objBand) continue;
      const band = this.createBandFromStorageObject(objBand, releaseObjs);
      if (!band) continue;

      bands.push(band);
    }

    return bands;
  }

  private static createBandFromStorageObject(
    bandObj: any,
    releaseObjs: StorableData,
  ): Band | null {
    if (!bandObj || typeof bandObj !== 'object') {
      return null;
    }

    const albumIds: number[] = bandObj.metadata.albums || [];
    const trackIds: number[] = bandObj.metadata.tracks || [];

    if (albumIds.length === 0 && trackIds.length === 0) {
      return BandFactory.fromStorage(bandObj);
    }

    const albums: Album[] = [];
    albumIds.forEach((albumId) => {
      const albumKey = StorageKey.albumKey(albumId);
      const albumObj = releaseObjs[albumKey];
      if (!albumObj) return;
      albums.push(AlbumFactory.fromStorageObject(albumObj));
    });

    const tracks: Track[] = [];
    trackIds.forEach((trackId) => {
      const trackKey = StorageKey.trackKey(trackId);
      const trackObj = releaseObjs[trackKey];
      if (!trackObj) return;
      tracks.push(TrackFactory.fromStorage(trackObj));
    });

    const band = BandFactory.fromStorage(bandObj);
    band.metadata.albums = albums;
    band.metadata.tracks = tracks;

    return band;
  }

  private static async getBandsIds(): Promise<number[]> {
    const bandsKey = StorageKey.bandsKey();
    const bandIds: number[] =
      (await storage.getByKey<number[]>(bandsKey)) || [];
    return bandIds;
  }

  private static async loadBandsStorableData(
    bandIds: number[],
  ): Promise<StorableData> {
    // Prepare all keys to load in one storage call
    const bandKeys: string[] = bandIds.map((id) => StorageKey.bandKey(id));

    // Load all band data in single call
    return await storage.get(bandKeys);
  }

  static async saveTrack(track: Track): Promise<void> {
    return await storage.set(track).catch((reason) => {
      throw new Error(reason);
    });
  }

  static async saveAlbum(album: Album): Promise<void> {
    const storageData: StorableData = album.toStorableData();
    await BandcampStorage.addTracksToStorageData(album.tracks, storageData);

    return await storage.set(storageData).catch((reason) => {
      throw new Error(reason);
    });
  }

  private static async addTracksToStorageData(
    tracks: Track[],
    storageData: StorableData,
  ): Promise<void> {
    const tracksData = await BandcampStorage.getTracksStorageData(tracks);
    for (const track of tracks) {
      const trackKey = StorageKey.trackKey(track.id);
      if (tracksData[trackKey]) {
        continue; // Skip if track data already exists
      }

      const trackStorableData = track.toStorableData();
      Object.assign(storageData, trackStorableData);
    }
  }

  static async getAlbumsStorageData(albums: Album[]): Promise<StorableData> {
    const albumKeys = albums.map((album) => StorageKey.albumKey(album.id));
    return await storage.get(albumKeys);
  }

  static async getTracksStorageData(tracks: Track[]): Promise<StorableData> {
    const trackKeys = tracks.map((track) => StorageKey.trackKey(track.id));
    return await storage.get(trackKeys);
  }

  static async loadAlbumsData(albums: Album[]): Promise<Album[]> {
    const albumsData = await BandcampStorage.getAlbumsStorageData(albums);
    const loadedAlbums = Object.values(albumsData)
      .filter(
        (data): data is object => typeof data === 'object' && data !== null,
      )
      .map((albumObj) => AlbumFactory.fromStorageObject(albumObj))
      .filter((album): album is Album => album !== null);

    // Create a map of loaded albums by ID for efficient lookup
    const loadedAlbumsMap = new Map(
      loadedAlbums.map((album) => [album.id, album]),
    );

    // Merge albums with loaded data, preferring loaded data when available
    return albums.map((album) => loadedAlbumsMap.get(album.id) || album);
  }
}
