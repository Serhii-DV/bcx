import type { Artist } from 'src/bandcamp/domain/artist/artist';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { BandIndexData } from 'src/bandcamp/domain/storage/bandIndexData';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';

export class ArtistTreeItem {
  static async createTreeItems(artist: Artist): Promise<TreeItem[]> {
    const bandIndexData = await BandIndexData.load();
    const bandIndexDataMap = new Map(Object.entries(bandIndexData));
    const bandIds = artist.names
      .filter((name) => bandIndexDataMap.has(name))
      .map((name) => Number(bandIndexDataMap.get(name)));
    const bands = await BandcampStorage.getBands(bandIds);

    return artist.names.map((name) => {
      if (bandIndexDataMap.has(name)) {
        const bandId = Number(bandIndexDataMap.get(name));
        const band = bands.find((b) => b.id === bandId);

        if (band) {
          return TreeItemFactory.fromBand(band);
        }
      }

      return {
        label: name,
      };
    });
  }
}
