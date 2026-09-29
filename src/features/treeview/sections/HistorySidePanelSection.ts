import { isFanAccount } from 'src/bandcamp/domain/fanData/library';
import { HistoryTreeItem } from '../items/HistoryTreeItem';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_HISTORY } from '../utils/icon';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';
import type { PageDataContext } from './types';

export class HistorySidePanelSection {
  static create(context?: PageDataContext | null): SidePanelSection {
    const identity = {
      fanId: context?.fanData.fan_id,
      username: context?.fanData.username,
    };
    const account = isFanAccount(identity) ? identity : undefined;
    return {
      fanAccount: account,
      id: 'history',
      label: 'History',
      image: ICON_HISTORY,
      rootNavigation: 'tabs',
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await HistoryTreeItem.createLatestVisitedSections(
            undefined,
            account?.fanId,
          ),
        ),
    };
  }
}
