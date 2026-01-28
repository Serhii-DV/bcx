import type { Band } from 'src/bandcamp/domain/band/band';
import { createQueryCountString } from 'src/bandcamp/domain/page/helper';
import type { QueryCountMap } from '$lib/components/bcx';
import type { TreeItem } from './treeItem';

export class TreeItemFactory {
  static fromBand(band: Band, queryCountMap: QueryCountMap): TreeItem {
    const children = band.metadata.artistNames.map((artist) => {
      const count = queryCountMap.get(artist) || 0;
      const label = createQueryCountString(artist, count);
      const artistChildren: TreeItem[] = [];

      band.metadata.albums.forEach((album) => {
        if (album.artist.names.includes(artist)) {
          artistChildren.push({
            label: album.toString(),
          });
        }
      });

      return {
        label,
        open: false,
        children: artistChildren,
      } as TreeItem;
    });

    return {
      label: createQueryCountString(
        band.name,
        band.metadata.artistNames.length,
      ),
      open: true,
      children,
    };
  }
}
