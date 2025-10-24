import { storage } from 'src/core/shared';
import type { StorableData } from 'src/core/storage';
import { Album } from './album/album';
import type { CompressedAlbumData, RawAlbumData } from './album/compressor';
import { AlbumFactory } from './album/factory';
import { Band } from './band/band';
import { type CompressedBandData } from './band/compressor';
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
    const albumData = await BandcampStorage.getAlbumsStorableData(
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

    const bandsStorableData = await this.getBandsStorableData(bandIds);

    // Collect release keys from loaded band data
    const releaseKeys: string[] = [];
    for (const key in bandsStorableData) {
      if (typeof bandsStorableData[key] !== 'object') {
        delete bandsStorableData[key];
      }

      const objBand = bandsStorableData[key];
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

    for (const key in bandsStorableData) {
      if (typeof bandsStorableData[key] !== 'object') {
        continue;
      }

      const objBand = bandsStorableData[key];
      if (!objBand) continue;
      const band = this.createBandFromStorageObject(objBand, releaseObjs);
      if (!band) continue;

      bands.push(band);
    }

    return bands;
  }

  private static createBandFromStorageObject(
    bandStorageObject: any,
    storableData: StorableData,
  ): Band | null {
    if (!bandStorageObject || typeof bandStorageObject !== 'object') {
      return null;
    }

    const bandRawData = BandFactory.createRawData(
      bandStorageObject as CompressedBandData,
    );
    const band = BandFactory.fromRawData(bandRawData);

    const albumIds: number[] = bandRawData.metadata?.albumIds || [];
    const trackIds: number[] = bandRawData.metadata?.trackIds || [];

    if (albumIds.length === 0 && trackIds.length === 0) {
      return band;
    }

    const albums = BandcampStorage.getAlbumsByAlbumIdsFromStorableData(
      storableData,
      albumIds,
    );

    const tracks = BandcampStorage.getTracksByTrackIdsFromStorableData(
      storableData,
      trackIds,
    );

    band.metadata.albums = albums;
    band.metadata.tracks = tracks;

    return band;
  }

  private static getAlbumsByAlbumIdsFromStorableData(
    storableData: StorableData,
    albumIds: number[],
  ): Album[] {
    const albums: Album[] = [];

    albumIds.forEach((albumId) => {
      const albumKey = StorageKey.albumKey(albumId);
      const albumObj = storableData[albumKey];
      if (!albumObj) return;
      albums.push(AlbumFactory.fromStorage(albumObj));
    });

    return albums;
  }

  static async getTracksByTrackIds(trackIds: number[]): Promise<Track[]> {
    const trackKeys = trackIds.map((trackId) => StorageKey.trackKey(trackId));
    const storableData = await storage.get(trackKeys);

    return trackKeys
      .map((trackKey) => storableData[trackKey])
      .filter(
        (trackObj): trackObj is object =>
          typeof trackObj === 'object' && trackObj !== null,
      )
      .map((trackObj) => TrackFactory.fromStorage(trackObj))
      .filter((track): track is Track => track !== null);
  }

  private static getTracksByTrackIdsFromStorableData(
    storableData: StorableData,
    trackIds: number[],
  ): Track[] {
    const tracks: Track[] = [];

    trackIds.forEach((trackId) => {
      const trackKey = StorageKey.trackKey(trackId);
      const trackObj = storableData[trackKey];
      if (!trackObj) return;
      tracks.push(TrackFactory.fromStorage(trackObj));
    });

    return tracks;
  }

  private static async getBandsIds(): Promise<number[]> {
    const bandsKey = StorageKey.bandsKey();
    const bandIds: number[] =
      (await storage.getByKey<number[]>(bandsKey)) || [];
    return bandIds;
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
    const tracksStorableData =
      await BandcampStorage.getTracksStorableData(tracks);
    for (const track of tracks) {
      const trackKey = StorageKey.trackKey(track.id);
      if (tracksStorableData[trackKey]) {
        continue; // Skip if track data already exists
      }

      const trackStorableData = track.toStorableData();
      Object.assign(storageData, trackStorableData);
    }
  }
  static async getBandsStorableData(bandIds: number[]): Promise<StorableData> {
    // Prepare all keys to load in one storage call
    const bandKeys: string[] = bandIds.map((id) => StorageKey.bandKey(id));

    // Load all band data in single call
    return await storage.get(bandKeys);
  }

  static async getAlbumsStorableData(albums: Album[]): Promise<StorableData> {
    const albumKeys = albums.map((album) => StorageKey.albumKey(album.id));
    return await storage.get(albumKeys);
  }

  static async getTracksStorableData(tracks: Track[]): Promise<StorableData> {
    const trackKeys = tracks.map((track) => StorageKey.trackKey(track.id));
    return await storage.get(trackKeys);
  }

  static async getAlbums(albums: Album[]): Promise<Album[]> {
    const albumsStorableData =
      await BandcampStorage.getAlbumsStorableData(albums);
    const albumsData: RawAlbumData[] = Object.values(albumsStorableData)
      .filter(
        (data): data is object => typeof data === 'object' && data !== null,
      )
      .map((albumObj) => {
        return AlbumFactory.createRawData(albumObj as CompressedAlbumData);
      });

    // Collect all unique track IDs from loaded albums
    const trackIds: number[] = [];
    albumsData.forEach((albumRawData) => {
      albumRawData.trackIds.forEach((id) => {
        if (!trackIds.includes(id)) {
          trackIds.push(id);
        }
      });
    });

    // Load all tracks data
    const tracks = await BandcampStorage.getTracksByTrackIds(trackIds);
    const loadedTracksMap = new Map(tracks.map((track) => [track.id, track]));

    const loadedAlbums = albumsData
      .map((albumRawData) => {
        const album = AlbumFactory.fromRawData(albumRawData);

        if (albumRawData.trackIds.length === 0) {
          return album;
        }

        // Map track IDs to loaded Track objects
        album.tracks = albumRawData.trackIds
          .map((trackId) => loadedTracksMap.get(trackId))
          .filter((track): track is Track => track !== undefined);

        return album;
      })
      .filter((album): album is Album => album !== null);

    // Create a map of loaded albums by ID for efficient lookup
    const loadedAlbumsMap = new Map(
      loadedAlbums.map((album) => [album.id, album]),
    );

    // Merge albums with loaded data, preferring loaded data when available
    return albums.map((album) => loadedAlbumsMap.get(album.id) || album);
  }

  static async getTracks(tracks: Track[]): Promise<Track[]> {
    const tracksStorableData =
      await BandcampStorage.getTracksStorableData(tracks);
    const loadedTracks = Object.values(tracksStorableData)
      .filter(
        (data): data is object => typeof data === 'object' && data !== null,
      )
      .map((trackObj) => TrackFactory.fromStorage(trackObj))
      .filter((track): track is Track => track !== null);

    // Create a map of loaded tracks by ID for efficient lookup
    const loadedTracksMap = new Map(
      loadedTracks.map((track) => [track.id, track]),
    );

    // Merge tracks with loaded data, preferring loaded data when available
    return tracks.map((track) => loadedTracksMap.get(track.id) || track);
  }
}
