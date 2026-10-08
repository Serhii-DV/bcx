import {
  getMusicRecordingSchema,
  type MusicRecordingSchema,
} from 'src/bandcamp/domain/page/schema';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { TrackFactory } from 'src/bandcamp/domain/track/factory';
import { Track } from 'src/bandcamp/domain/track/track';
import { isBandcampTrackUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { TrackTreeItemFactory } from '../factories/TrackTreeItemFactory';
import type { SidePanelSection } from '../SidePanelSection';
import { TreeData } from '../TreeData';

export class TrackSidePanelSection {
  static async create(
    url: Url,
    schema?: MusicRecordingSchema | null,
  ): Promise<SidePanelSection | null> {
    if (!isBandcampTrackUrl(url)) return null;
    // Injected panels can read the schema directly; browser panels receive it
    // through the existing active-page message instead.
    if (
      schema === undefined &&
      window.location.protocol !== 'chrome-extension:'
    ) {
      try {
        schema = getMusicRecordingSchema();
      } catch {
        schema = null;
      }
    }
    const [stored] = await BandcampStorage.getByUuids([
      url.withoutSearchAndHash.uuid,
    ]);
    const track =
      schema?.mainEntityOfPage === url.withoutSearchAndHash.toString()
        ? TrackFactory.fromSchema(schema, {})
        : stored instanceof Track
          ? stored
          : undefined;
    if (!track) return null;
    return {
      id: `track-${track.id || url.withoutSearchAndHash.uuid}`,
      label: track.toString(),
      image: track.artwork.id > 0 ? track.artwork.tinySizeUrl : undefined,
      defaultOpen: true,
      releasePreview: TrackTreeItemFactory.createWithPreview(track),
      createTreeData: async () => new TreeData(),
    };
  }
}
