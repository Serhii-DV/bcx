import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import { TreeItemButtonFactory } from '../buttons/factory';
import type { TreeItem } from '../TreeItem';
import { item } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';

type CreateStoredFanListTreeItemOptions<T> = {
  label: string;
  openButtonLabel: string;
  openUrl: string;
  refreshButtonLabel: string;
  storageKey: string;
  username: string;
  loadItems: () => Promise<T[]>;
  createTreeItem: (item: T) => TreeItem;
};

export async function createStoredFanListTreeItem<T>(
  options: CreateStoredFanListTreeItemOptions<T>,
): Promise<TreeItem> {
  const storedItems = await loadItemsFromStorage<T>(options.storageKey);
  const children = storedItems.map(options.createTreeItem);
  const buttons = createButtons(options);

  return item(options.label)
    .withChildren(children)
    .withButtons(buttons)
    .build();
}

function createButtons<T>(
  options: CreateStoredFanListTreeItemOptions<T>,
): TreeItemButton[] {
  const buttons: TreeItemButton[] = [
    TreeItemButtonFactory.createExternalLink(
      options.openButtonLabel,
      options.openUrl,
    ),
  ];

  if (isBandcampFanUrl(currentPageUrl, options.username)) {
    buttons.unshift(
      TreeItemButtonFactory.createRefreshButton(
        options.refreshButtonLabel,
        createLoadHandler(async () => {
          const items = await options.loadItems();
          await storage.set({ [options.storageKey]: items });

          return items;
        }),
      ),
    );
  }

  return buttons;
}

async function loadItemsFromStorage<T>(storageKey: string): Promise<T[]> {
  return (await storage.getByKey(storageKey)) || [];
}
