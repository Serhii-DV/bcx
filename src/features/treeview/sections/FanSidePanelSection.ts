import { FanPageDataTreeItem } from '../items/FanPageDataTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';
import type { PageDataContext } from './types';

export class FanSidePanelSection {
  static create(
    pageDataContext: PageDataContext | null,
    userKeyPart: string,
  ): SidePanelSection | null {
    if (!pageDataContext) {
      return null;
    }

    const fanData = pageDataContext.fanData;
    const pageData = pageDataContext.data;
    const pageFan = pageData?.fan_data;

    if (
      !Number.isSafeInteger(pageFan?.fan_id) ||
      pageFan.fan_id <= 0 ||
      typeof pageFan.username !== 'string' ||
      !pageFan.username ||
      fanData.fan_id === pageFan.fan_id
    ) {
      return null;
    }

    return {
      id: `fan-${userKeyPart}`,
      label: `Fan: ${pageFan.name || pageFan.username}`,
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await FanPageDataTreeItem.create(pageDataContext),
        ),
    };
  }
}
