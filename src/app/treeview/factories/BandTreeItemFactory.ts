import { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';

export class BandTreeItemFactory {
  static create(band: Band): TreeItem {
    return TreeItemBuilder.linkOrText(band.name, band.url?.toString())
      .withImage(band.artwork.tinySizeUrl)
      .build();
  }
}
