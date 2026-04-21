import type { Track } from 'src/bandcamp/domain/track/track';
import type { TreeItem } from '../TreeItem';
import { linkOrText } from '../TreeItemBuilder';

export class TrackTreeItemFactory {
  static create(track: Track): TreeItem {
    return linkOrText(
      track.toAlbumTrackString(),
      track.url?.toString(),
    ).build();
  }

  static createMany(tracks: Track[]): TreeItem[] {
    return tracks.map((track) => this.create(track));
  }
}
