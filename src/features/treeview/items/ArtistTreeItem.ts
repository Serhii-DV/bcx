import type { Artist } from 'src/bandcamp/domain/artist/artist';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { normalizeMusicName } from 'src/bandcamp/domain/storage/musicLibraryProtocol';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { text } from '../TreeItemBuilder';

export class ArtistTreeItem {
  static async createTreeItems(artist: Artist): Promise<TreeItem[]> {
    const bands = await BandcampStorage.getBandsByNames(artist.names);
    return artist.names.flatMap((name) => {
      const matches = bands.filter(
        (band) => normalizeMusicName(band.name) === normalizeMusicName(name),
      );
      return matches.length
        ? matches.map((band) => BandTreeItemFactory.createWithPreview(band))
        : [text(name).makeCopyable().build()];
    });
  }
}
