import { ExternalLink, RefreshCcw } from 'lucide-svelte';
import { PageCollection } from 'src/bandcamp/domain/page/PageCollection';
import type { GenreItem } from 'src/bandcamp/domain/types/CollectionPageData';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';

const FOLLOWING_GENRES_KEY = '/following-genres';

export class FollowingGenresTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const followingGenres: GenreItem[] = await loadFollowingGenresFromStorage();
    const children: TreeItem[] = followingGenres.map((item) => ({
      label: item.name,
      href: item.tag_page_url,
    }));

    const buttons: TreeItemButton[] = [
      createFollowingGenresOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createFollowingGenresRefreshTreeItemButton());
    }

    return {
      label: `Following Genres`,
      children,
      buttons,
    };
  }
}

function createFollowingGenresOpenTreeItemButton(
  username: string,
): TreeItemButton {
  return {
    title: 'Open Following Genres',
    icon: ExternalLink,
    href: BandcampUrlFactory.generateFollowingGenresUrl(username),
  };
}

function createFollowingGenresRefreshTreeItemButton(): TreeItemButton {
  return {
    title: 'Refresh Following Genres',
    icon: RefreshCcw,
    onClick: createLoadHandler(loadFollowingGenres),
  };
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
