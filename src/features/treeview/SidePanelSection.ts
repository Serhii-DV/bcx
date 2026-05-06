import type { TreeData } from './TreeData';

export interface SidePanelSection {
  id: string;
  label: string;
  image?: string;
  childrenCount?: number;
  defaultOpen?: boolean;
  createTreeData: () => Promise<TreeData>;
}
