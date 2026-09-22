import { ArtworkSize } from 'src/bandcamp/domain/artwork/artworkSize';
import type { Track } from 'src/bandcamp/domain/track/track';
import { createTrackInformation } from '../ReleasePreview';
import type { TreeItem } from '../TreeItem';
import { linkOrText } from '../TreeItemBuilder';

type TreeItemTrack = Pick<Track, 'toAlbumTrackString'> & {
  url?: URL;
};

export class TrackTreeItemFactory {
  static createWithPreview(track: Track): TreeItem {
    return {
      ...this.create(track),
      previewImage: track.artwork.getUrl(ArtworkSize.LARGE) ?? undefined,
      previewInformation: createTrackInformation(track),
    };
  }

  static create(track: TreeItemTrack): TreeItem {
    return linkOrText(
      track.toAlbumTrackString(),
      track.url?.toString(),
    ).build();
  }

  static createMany(tracks: TreeItemTrack[]): TreeItem[] {
    return tracks.map((track) => this.create(track));
  }
}
