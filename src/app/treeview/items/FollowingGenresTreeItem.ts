import { PageCollection } from 'src/bandcamp/domain/page/PageCollection';
import type { GenreItem } from 'src/bandcamp/domain/types/CollectionPageData';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import { TreeItemButtonFactory } from '../buttons/factory';
import type { TreeItem } from '../TreeItem';
import { item, link } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';
import { ICON_TAG } from '../utils/icon';

const FOLLOWING_GENRES_KEY = '/following-genres';

export class FollowingGenresTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const followingGenres: GenreItem[] = await loadFollowingGenresFromStorage();
    const children: TreeItem[] = followingGenres.map((item) =>
      link(item.name, item.tag_page_url).withImage(ICON_TAG).build(),
    );
    const buttons: TreeItemButton[] = [
      createFollowingGenresOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createFollowingGenresRefreshTreeItemButton());
    }

    return item('Following Genres')
      .withChildren(children)
      .withButtons(buttons)
      .build();
  }
}

function createFollowingGenresOpenTreeItemButton(
  username: string,
): TreeItemButton {
  return TreeItemButtonFactory.createExternalLink(
    'Open Following Genres',
    BandcampUrlFactory.generateFollowingGenresUrl(username),
  );
}

function createFollowingGenresRefreshTreeItemButton(): TreeItemButton {
  return TreeItemButtonFactory.createRefreshButton(
    'Refresh Following Genres',
    createLoadHandler(loadFollowingGenres),
  );
}

async function loadFollowingGenresFromStorage(): Promise<GenreItem[]> {
  return (await storage.getByKey(FOLLOWING_GENRES_KEY)) || [];
}

async function loadFollowingGenres(): Promise<GenreItem[]> {
  const pageCollection = new PageCollection();
  const followingGenres = await pageCollection.loadFollowingGenresItems();
  await storage.set({ [FOLLOWING_GENRES_KEY]: followingGenres });

  return followingGenres;
}
