import { PageCollection } from 'src/bandcamp/domain/page/PageCollection';
import type { GenreItem } from 'src/bandcamp/domain/types/CollectionPageData';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import type { TreeItem } from '../TreeItem';
import { link } from '../TreeItemBuilder';
import { ICON_TAG } from '../utils/icon';
import { createStoredFanListTreeItem } from './storedFanListTreeItem';

const FOLLOWING_GENRES_KEY = '/following-genres';

export class FollowingGenresTreeItem {
  static async create(username: string): Promise<TreeItem> {
    return createStoredFanListTreeItem<GenreItem>({
      label: 'Following Genres',
      openButtonLabel: 'Open Following Genres',
      openUrl: BandcampUrlFactory.generateFollowingGenresUrl(username),
      refreshButtonLabel: 'Refresh Following Genres',
      storageKey: FOLLOWING_GENRES_KEY,
      username,
      loadItems: loadFollowingGenres,
      createTreeItem: (item) =>
        link(item.name, item.tag_page_url).withImage(ICON_TAG).build(),
    });
  }
}

async function loadFollowingGenres(): Promise<GenreItem[]> {
  const pageCollection = new PageCollection();
  return pageCollection.loadFollowingGenresItems();
}
