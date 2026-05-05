import { HistoryTreeItem } from '../items/HistoryTreeItem';
import { ICON_HISTORY } from '../utils/icon';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';
import type { PendingSidePanelSection } from './types';

export class HistorySidePanelSection {
  static create(): PendingSidePanelSection {
    return {
      label: 'History',
      image: ICON_HISTORY,
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await HistoryTreeItem.createLatestVisited(),
        ),
    };
  }
}
