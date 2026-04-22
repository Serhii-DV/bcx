import type { TreeItem } from '../TreeItem';
import { text } from '../TreeItemBuilder';

export class DateTreeItemFactory {
  static create(date: Date): TreeItem {
    const label = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return text(label).build();
  }
}
