import { ExternalLink, RefreshCcw } from 'lucide-svelte';
import { PageCollection } from 'src/bandcamp/domain/page/PageCollection';
import type { GenreItem } from 'src/bandcamp/domain/types/CollectionPageData';
import { storage } from 'src/core/shared';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';

const FOLLOWING_GENRES_KEY = '/following-genres';

export class FollowingGenresTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const followingGenres = await loadFollowingGenresFromStorage();
    const children: TreeItem[] = followingGenres.map((item) => ({
      label: item.name,
    }));

    const buttons: TreeItemButton[] = [
      createFollowingGenresOpenTreeItemButton(username),
      createFollowingGenresRefreshTreeItemButton(),
    ];

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
    href: `https://bandcamp.com/${username}`,
  };
}

function createFollowingGenresRefreshTreeItemButton(): TreeItemButton {
  return {
    title: 'Refresh Following Genres',
    icon: RefreshCcw,
    onClick: async (element: HTMLElement) => {
      if (element.dataset.loading === 'true') {
        return;
      }

      element.textContent = 'Loading...';
      element.dataset.loading = 'true';

      const followingGenres = await loadFollowingGenres();

      element.textContent = 'Loaded ' + followingGenres.length + ' genres';
      element.dataset.loading = 'false';
    },
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
