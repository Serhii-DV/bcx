import type { StorableData } from 'src/core/storage';
import { isEqual } from 'src/utils/object';
import { Album } from './album/album';
import type { CompressedAlbumData, RawAlbumData } from './album/compressor';
import { AlbumFactory } from './album/factory';
import { Band } from './band/band';
import { type CompressedBandData } from './band/compressor';
import { BandFactory } from './band/factory';
import { bandDataCompressor } from './shared';
import { requestMusicLibrary } from './storage/musicLibrary';
import { musicStorage } from './storage/musicStorage';
import { StorageKey } from './storageKey';
import { TrackFactory } from './track/factory';
import type { Track } from './track/track';

export class BandcampStorage {
  static async saveBand(band: Band): Promise<void> {
    await requestMusicLibrary({
      action: 'save',
      data: {
        bands: [band.toRawData()],
        albums: band.metadata.albums.map((album) => album.toRawData()),
        tracks: [
          ...band.metadata.tracks,
          ...band.metadata.albums.flatMap((album) => album.tracks),
        ].map((track) => track.toRawData()),
      },
    });
  }

  static async getBands(bandIds: number[] = []): Promise<Band[]> {
    if (bandIds.length === 0) {
      const bands = await requestMusicLibrary({
        action: 'read',
        store: 'bands',
      });
      if (!bands.bands.length) return [];
      return this.getBands(bands.bands.map((band) => band.id));
    }

    const bandsStorableData = await this.getBandsStorableData(bandIds);

    // Collect release keys from loaded band data
    const releaseKeys: string[] = [];
    for (const key in bandsStorableData) {
      if (
        !bandsStorableData[key] ||
        typeof bandsStorableData[key] !== 'object'
      ) {
        delete bandsStorableData[key];
        continue;
      }

      const band = bandDataCompressor.decompress(bandsStorableData[key]);
      band?.metadata?.albumIds.forEach((albumId: number) => {
        const albumKey = StorageKey.albumKey(albumId);
        if (releaseKeys.includes(albumKey)) return;
        releaseKeys.push(albumKey);
      });
      band?.metadata?.trackIds.forEach((trackId: number) => {
        const trackKey = StorageKey.trackKey(trackId);
        if (releaseKeys.includes(trackKey)) return;
        releaseKeys.push(trackKey);
      });
    }

    // Load releases data if needed
    const releaseObjs = releaseKeys.length
      ? await musicStorage.get(Array.from(releaseKeys))
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

  static async getByUuids(uuids: string[]): Promise<(Band | Album | Track)[]> {
    const data = await requestMusicLibrary({ action: 'lookup', uuids });
    return [
      ...data.bands.map((band) => BandFactory.fromRawData(band)),
      ...data.albums.map((album) => AlbumFactory.fromRawData(album)),
      ...data.tracks.map((track) => TrackFactory.fromRawData(track)),
    ];
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
    const storableData = await musicStorage.get(trackKeys);

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

  static async saveTrack(track: Track): Promise<void> {
    await requestMusicLibrary({
      action: 'save',
      data: { tracks: [track.toRawData()] },
    });
  }

  static async saveAlbum(album: Album): Promise<void> {
    await requestMusicLibrary({
      action: 'save',
      data: {
        albums: [album.toRawData()],
        tracks: album.tracks.map((track) => track.toRawData()),
      },
    });
  }

  static async removeTracks(trackIds: number[]): Promise<void> {
    await requestMusicLibrary({ action: 'remove-tracks', ids: trackIds });
  }

  static async findAlbumsByArtists(
    artists: readonly string[],
  ): Promise<RawAlbumData[]> {
    return (
      await requestMusicLibrary({
        action: 'find-albums',
        artists: [...artists],
      })
    ).albums;
  }

  static async findAlbumsByTitleAndArtist(
    title: string,
    artist: string,
  ): Promise<RawAlbumData[]> {
    return (
      await requestMusicLibrary({ action: 'match-albums', title, artist })
    ).albums;
  }

  static async getBandsByNames(names: readonly string[]): Promise<Band[]> {
    const result = await requestMusicLibrary({
      action: 'find-bands',
      names: [...names],
    });
    return result.bands.length
      ? this.getBands(result.bands.map((band) => band.id))
      : [];
  }

  static async getBandsStorableData(bandIds: number[]): Promise<StorableData> {
    // Prepare all keys to load in one storage call
    const bandKeys: string[] = bandIds.map((id) => StorageKey.bandKey(id));

    // Load all band data in single call
    return await musicStorage.get(bandKeys);
  }

  static async getAlbumsStorableDataByIds(
    albumIds: number[],
  ): Promise<StorableData> {
    const albumKeys = albumIds.map((albumId) => StorageKey.albumKey(albumId));
    return await musicStorage.get(albumKeys);
  }

  static async getAlbumsStorableData(albums: Album[]): Promise<StorableData> {
    const albumKeys = albums.map((album) => StorageKey.albumKey(album.id));
    return await musicStorage.get(albumKeys);
  }

  static async getTracksStorableData(tracks: Track[]): Promise<StorableData> {
    const trackKeys = tracks.map((track) => StorageKey.trackKey(track.id));
    return await musicStorage.get(trackKeys);
  }

  static async getAlbumsRawDataByIds(
    albumIds: number[],
  ): Promise<RawAlbumData[]> {
    const albumsStorableData =
      await BandcampStorage.getAlbumsStorableDataByIds(albumIds);
    const albumsRawDataArray: RawAlbumData[] = Object.values(albumsStorableData)
      .filter((obj): obj is object => typeof obj === 'object' && obj !== null)
      .map((obj) => AlbumFactory.createRawData(obj as CompressedAlbumData));

    return albumsRawDataArray;
  }

  static async getAllAlbumsRawData(
    savedKeys?: readonly string[],
  ): Promise<RawAlbumData[]> {
    if (savedKeys) {
      const ids = savedKeys
        .filter(StorageKey.isAlbumKey)
        .map((key) => Number(key.slice(3)));
      return ids.length ? this.getAlbumsRawDataByIds(ids) : [];
    }
    return (await requestMusicLibrary({ action: 'read', store: 'albums' }))
      .albums;
  }

  static async getAlbums(
    albums: Album[],
    savedData?: RawAlbumData[],
  ): Promise<Album[]> {
    const albumIds = albums.map((album) => album.id);
    const albumsRawDataArray =
      savedData ?? (await BandcampStorage.getAlbumsRawDataByIds(albumIds));

    // Collect all unique track IDs from loaded albums
    const trackIds = [
      ...new Set(albumsRawDataArray.flatMap((album) => album.trackIds)),
    ];

    // Load all tracks data
    const tracks = await BandcampStorage.getTracksByTrackIds(trackIds);
    const loadedTracksMap = new Map(tracks.map((track) => [track.id, track]));

    const loadedAlbums = albumsRawDataArray
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
    return albums.map((album) => {
      const storageAlbum = loadedAlbumsMap.get(album.id);

      if (storageAlbum === undefined) {
        return album;
      }

      // If the loaded album is equal to the current one, return the current one to preserve object references
      if (!isEqual(storageAlbum.artwork, album.artwork)) {
        storageAlbum.artwork = album.artwork;
      }

      return storageAlbum;
    });
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

  static async getAllCompressedBandData(
    savedKeys?: readonly string[],
  ): Promise<CompressedBandData[]> {
    const data = savedKeys
      ? await musicStorage.get(savedKeys.filter(StorageKey.isBandKey))
      : await musicStorage.getAllBands();
    return Object.values(data).filter(
      (value): value is CompressedBandData =>
        typeof value === 'object' && value !== null,
    );
  }
}
