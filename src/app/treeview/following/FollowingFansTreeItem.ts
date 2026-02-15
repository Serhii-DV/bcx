import { ExternalLink, RefreshCcw } from 'lucide-svelte';
import { PageCollection } from 'src/bandcamp/domain/page/PageCollection';
import type { FollowingFanItem } from 'src/bandcamp/domain/types/CollectionPageData';
import { storage } from 'src/core/shared';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';

const FOLLOWING_FANS_KEY = '/following-fans';

export class FollowingFansTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const followingFans = await loadFollowingFansFromStorage();
    const children: TreeItem[] = followingFans.map((item) => ({
      label: item.name,
      href: item.fan_url ?? undefined,
    }));

    const buttons: TreeItemButton[] = [
      createFollowingFansOpenTreeItemButton(username),
      createFollowingFansRefreshTreeItemButton(),
    ];

    return {
      label: `Following Fans`,
      children,
      buttons,
    };
  }
}

function createFollowingFansOpenTreeItemButton(
  username: string,
): TreeItemButton {
  return {
    title: 'Open Following Fans',
    icon: ExternalLink,
    href: `https://bandcamp.com/${username}`,
  };
}

function createFollowingFansRefreshTreeItemButton(): TreeItemButton {
  return {
    title: 'Refresh Following Fans',
    icon: RefreshCcw,
    onClick: async (element: HTMLElement) => {
      if (element.dataset.loading === 'true') {
        return;
      }

      element.textContent = 'Loading...';
      element.dataset.loading = 'true';

      const followingFans = await loadFollowingFans();

      element.textContent = 'Loaded ' + followingFans.length + ' fans';
      element.dataset.loading = 'false';
    },
  };
}

async function loadFollowingFansFromStorage(): Promise<FollowingFanItem[]> {
  return (await storage.getByKey(FOLLOWING_FANS_KEY)) || [];
}

async function loadFollowingFans(): Promise<FollowingFanItem[]> {
  const pageCollection = new PageCollection();
  const followingFans = await pageCollection.loadFollowingFansItems();
  await storage.set({ [FOLLOWING_FANS_KEY]: followingFans });

  return followingFans;
}
