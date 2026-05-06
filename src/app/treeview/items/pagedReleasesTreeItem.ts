import type { Album } from 'src/bandcamp/domain/album/album';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { ICON_DISC } from '../utils/icon';
import { createPagedTreeItem } from './pagedTreeItem';

const RELEASE_BATCH_SIZE = 20;

type CreatePagedReleasesTreeItemArgs = {
  albums: Album[];
  errorContext: string;
  withAlbumSummary?: boolean;
};

export function createPagedReleasesTreeItem({
  albums,
  errorContext,
  withAlbumSummary = false,
}: CreatePagedReleasesTreeItemArgs): TreeItem {
  return createPagedTreeItem({
    batchSize: RELEASE_BATCH_SIZE,
    errorContext,
    errorMessage: 'Failed to load more releases:',
    image: ICON_DISC,
    items: albums,
    label: 'Releases',
    createChildren: (albums) =>
      AlbumTreeItemFactory.fromAlbums(albums, withAlbumSummary),
  });
}
