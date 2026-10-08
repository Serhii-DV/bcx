import type {
  FanAccount,
  FanDataset,
} from 'src/bandcamp/domain/fanData/library';
import type { TreeData } from './TreeData';
import type { TreeItem } from './TreeItem';

export interface SidePanelSection {
  id: string;
  fanSync?: { account?: FanAccount; dataset: FanDataset };
  fanAccount?: FanAccount;
  label: string;
  image?: string;
  childrenCount?: number;
  defaultOpen?: boolean;
  initialSelectedHref?: string;
  navigationUrls?: string[];
  rootNavigation?: 'tabs';
  releasePreview?: TreeItem;
  createTreeData: () => Promise<TreeData>;
}
