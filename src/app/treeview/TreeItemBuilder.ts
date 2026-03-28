import type { TreeItem } from './TreeItem';
import type { TreeItemButton } from './TreeItemButton';

export class TreeItemBuilder {
  private item: Partial<TreeItem> = {};

  constructor(existingItem?: TreeItem) {
    if (existingItem) {
      this.item = { ...existingItem };
    }
  }

  withId(id: string): this {
    this.item.id = id;
    return this;
  }

  withLabel(label: string): this {
    this.item.label = label;
    return this;
  }

  withChildren(children: TreeItem[]): this {
    this.item.children = children;
    return this;
  }

  withOpen(open: boolean): this {
    this.item.open = open;
    return this;
  }

  withLevel(level: number): this {
    this.item.level = level;
    return this;
  }

  withPath(path: string): this {
    this.item.path = path;
    return this;
  }

  withHref(href: string): this {
    this.item.href = href;
    return this;
  }

  withoutHref(): this {
    this.item.href = undefined;
    return this;
  }

  withImage(image: string): this {
    this.item.image = image;
    return this;
  }

  withQuery(query: string): this {
    this.item.query = query;
    return this;
  }

  withKeywords(keywords: string[]): this {
    this.item.keywords = keywords;
    return this;
  }

  withButtons(buttons: TreeItemButton[]): this {
    this.item.buttons = buttons;
    return this;
  }

  withOnClick(onClick: (element: HTMLElement) => void): this {
    this.item.onClick = onClick;
    return this;
  }

  build(): TreeItem {
    if (!this.item.label) {
      throw new Error('TreeItem must have a label');
    }
    return this.item as TreeItem;
  }
}
