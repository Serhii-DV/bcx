import { HistoryTreeItem } from '../items/HistoryTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_HISTORY } from '../utils/icon';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';

export class HistorySidePanelSection {
  static create(): SidePanelSection {
    return {
      id: 'history',
      label: 'History',
      image: ICON_HISTORY,
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await HistoryTreeItem.createLatestVisited(),
        ),
    };
  }
}
