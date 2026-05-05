import { FanPageDataTreeItem } from '../items/FanPageDataTreeItem';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';
import type {
  PendingSidePanelSection,
  SidePanelSectionsContext,
} from './types';

export class FanSidePanelSection {
  static create({
    pageDataContext,
  }: SidePanelSectionsContext): PendingSidePanelSection | null {
    if (!pageDataContext) {
      return null;
    }

    const fanData = pageDataContext.fanData;
    const pageData = pageDataContext.data;

    if (fanData.fan_id === pageData?.fan_data?.fan_id) {
      return null;
    }

    return {
      label: `Fan: ${fanData.name}`,
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await FanPageDataTreeItem.create(pageDataContext),
        ),
    };
  }
}
