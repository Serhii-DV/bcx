import type { Track } from 'src/bandcamp/domain/track/track';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';

export class TrackTreeItemFactory {
  static create(track: Track): TreeItem {
    return TreeItemBuilder.linkOrText(
      track.toAlbumTrackString(),
      track.url?.toString(),
    ).build();
  }

  static createMany(tracks: Track[]): TreeItem[] {
    return tracks.map((track) => this.create(track));
  }
}
