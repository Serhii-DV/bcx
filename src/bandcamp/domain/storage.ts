import { isEqual } from 'src/utils/object';
import { Album } from './album/album';
import type { RawAlbumData } from './album/data';
import { AlbumFactory } from './album/factory';
import { Band } from './band/band';
import type { RawBandData } from './band/data';
import { BandFactory } from './band/factory';
import { requestMusicLibrary } from './storage/musicLibrary';
import type { RawTrackData } from './track/data';
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
    const { bands } = await requestMusicLibrary({
      action: 'read',
      store: 'bands',
      ids: bandIds.length ? bandIds : undefined,
    });
    if (!bands.length) return [];

    const albumIds = [
      ...new Set(bands.flatMap((band) => band.metadata.albumIds)),
    ];
    const trackIds = [
      ...new Set(bands.flatMap((band) => band.metadata.trackIds)),
    ];
    const [albums, tracks] = await Promise.all([
      this.getAlbumsRawDataByIds(albumIds),
      trackIds.length
        ? requestMusicLibrary({
            action: 'read',
            store: 'tracks',
            ids: trackIds,
          }).then((data) => data.tracks)
        : [],
    ]);
    const albumsById = new Map(albums.map((album) => [album.id, album]));
    const tracksById = new Map(tracks.map((track) => [track.id, track]));

    return bands.map((rawData) => {
      const band = BandFactory.fromRawData(rawData);
      band.metadata.albums = rawData.metadata.albumIds
        .map((id) => albumsById.get(id))
        .filter((album): album is RawAlbumData => album !== undefined)
        .map(AlbumFactory.fromRawData);
      band.metadata.tracks = rawData.metadata.trackIds
        .map((id) => tracksById.get(id))
        .filter((track): track is RawTrackData => track !== undefined)
        .map(TrackFactory.fromRawData);
      return band;
    });
  }

  static async getByUuids(uuids: string[]): Promise<(Band | Album | Track)[]> {
    const data = await requestMusicLibrary({ action: 'lookup', uuids });
    return [
      ...data.bands.map((band) => BandFactory.fromRawData(band)),
      ...data.albums.map((album) => AlbumFactory.fromRawData(album)),
      ...data.tracks.map((track) => TrackFactory.fromRawData(track)),
    ];
  }
  static async getTracksByTrackIds(trackIds: number[]): Promise<Track[]> {
    if (!trackIds.length) return [];
    const { tracks } = await requestMusicLibrary({
      action: 'read',
      store: 'tracks',
      ids: trackIds,
    });
    return tracks.map((track) => TrackFactory.fromRawData(track));
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

  static async getAlbumsRawDataByIds(
    albumIds: number[],
  ): Promise<RawAlbumData[]> {
    if (!albumIds.length) return [];
    return (
      await requestMusicLibrary({
        action: 'read',
        store: 'albums',
        ids: albumIds,
      })
    ).albums;
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
    const loadedTracks = await this.getTracksByTrackIds(
      tracks.map((track) => track.id),
    );

    // Create a map of loaded tracks by ID for efficient lookup
    const loadedTracksMap = new Map(
      loadedTracks.map((track) => [track.id, track]),
    );

    // Merge tracks with loaded data, preferring loaded data when available
    return tracks.map((track) => loadedTracksMap.get(track.id) || track);
  }

  static async getAllBandsRawData(): Promise<RawBandData[]> {
    return (await requestMusicLibrary({ action: 'read', store: 'bands' }))
      .bands;
  }
}
