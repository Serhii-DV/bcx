import { ArtworkSize } from 'src/bandcamp/domain/artwork/artworkSize';
import { Track } from 'src/bandcamp/domain/track/track';
import { createTrackInformation } from '../ReleasePreview';
import { formatReleasePrice, getReleasePrice } from '../releasePrice';
import type { TreeItem } from '../TreeItem';
import { linkOrText } from '../TreeItemBuilder';

type TreeItemTrack = Pick<Track, 'toAlbumTrackString'> & {
  url?: URL;
  metadata?: Track['metadata'];
};

export class TrackTreeItemFactory {
  static createWithPreview(track: Track): TreeItem {
    return {
      ...this.create(track),
      entityId: track.id,
      previewImage:
        track.artwork.id > 0
          ? (track.artwork.getUrl(ArtworkSize.LARGE) ?? undefined)
          : undefined,
      previewInformation: createTrackInformation(track),
    };
  }

  static create(track: TreeItemTrack): TreeItem {
    return linkOrText(track.toAlbumTrackString(), track.url?.toString())
      .apply((item) => {
        item.price = formatReleasePrice(getReleasePrice(track.metadata));
      })
      .build();
  }

  static createMany(tracks: TreeItemTrack[]): TreeItem[] {
    return tracks.map((track) =>
      track instanceof Track
        ? this.createWithPreview(track)
        : this.create(track),
    );
  }
}
