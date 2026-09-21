import { Band } from 'src/bandcamp/domain/band/band';
import type { BandPreview } from '../BandPreview';
import type { TreeItem } from '../TreeItem';
import { linkOrText } from '../TreeItemBuilder';

export class BandTreeItemFactory {
  static createWithPreview(
    band: Band,
    options: Pick<BandPreview, 'following' | 'location'> = {},
  ): TreeItem {
    return {
      ...this.create(band),
      bandPreview: {
        id: band.id,
        name: band.name,
        url: band.url.toString(),
        image: band.artwork.id > 0 ? band.artwork.mediumSizeUrl : undefined,
        location: band.metadata.location,
        cached: false,
        ...options,
      },
    };
  }

  static create(band: Band): TreeItem {
    return linkOrText(band.name, band.url?.toString())
      .withImage(band.artwork.tinySizeUrl)
      .build();
  }
}
