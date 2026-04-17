import type { TreeItem, TreeItemClickContext } from './TreeItem';
import type { TreeItemButton } from './TreeItemButton';

export class TreeItemBuilder {
  private item: TreeItem = {};

  constructor(existingItem?: TreeItem) {
    if (existingItem) {
      this.item = { ...existingItem };
    }
  }

  static create(item: TreeItem) {
    return new TreeItemBuilder(item);
  }

  withId(id: string): this {
    this.item.id = id;
    return this;
  }

  withLabel(label: string): this {
    this.item.label = label;
    return this;
  }

  withChildren(children?: Array<TreeItem | undefined>): this {
    this.item.children = children?.filter(
      (child): child is TreeItem => child !== undefined,
    );
    return this;
  }

  addChild(child?: TreeItem): this {
    if (!child) {
      return this;
    }
    if (!this.item.children) {
      this.item.children = [];
    }
    this.item.children.push(child);
    return this;
  }

  addChildren(children: Array<TreeItem | undefined>): this {
    children.forEach((child) => this.addChild(child));
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

  includeInFilterSuggestions(include: boolean = true): this {
    this.item.includeInFilterSuggestions = include;
    return this;
  }

  withButtons(buttons: TreeItemButton[]): this {
    this.item.buttons = buttons;
    return this;
  }

  withOnClick(
    onClick: (context: TreeItemClickContext) => void | Promise<void>,
  ): this {
    this.item.onClick = onClick;
    return this;
  }

  withoutActionIcon(): this {
    this.item.actionIcon = undefined;
    return this;
  }

  withoutLink(): this {
    return this.withoutHref().withoutActionIcon();
  }

  withoutChildrenCount(): this {
    this.item.showChildrenCount = false;
    return this;
  }

  withoutChildrenCountAllChildren(): this {
    this.item.children?.forEach((child) => {
      child.showChildrenCount = false;
    });
    return this;
  }

  apply(updater: (item: TreeItem) => void): this {
    updater(this.item);
    return this;
  }

  build(): TreeItem {
    if (!this.item.label) {
      throw new Error('TreeItem must have a label');
    }
    return this.item as TreeItem;
  }
}
