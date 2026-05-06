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

    if (fanData.fan_id === pageData?.fan_data?.fan_id) {
      return null;
    }

    return {
      id: `fan-${userKeyPart}`,
      label: `Fan: ${fanData.name}`,
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await FanPageDataTreeItem.create(pageDataContext),
        ),
    };
  }
}
