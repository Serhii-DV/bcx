import { copyToClipboard } from 'src/utils/clipboard';
import type {
  TreeItem,
  TreeItemClickContext,
  TreeItemLayout,
} from './TreeItem';
import type { TreeItemButton } from './TreeItemButton';
import {
  ICON_CLIPBOARD_COPY,
  ICON_EXTERNAL_LINK,
  ICON_SQUARE_ARROW_RIGHT,
} from './utils/icon';

type ItemOrBuilder = TreeItem | TreeItemBuilder;

export class TreeItemBuilder {
  private item: TreeItem = {};

  constructor(existingItem?: TreeItem) {
    if (existingItem) {
      this.item = { ...existingItem };
    }
  }

  static create(item: TreeItem): TreeItemBuilder {
    return new TreeItemBuilder(item);
  }

  static text(label: string): TreeItemBuilder {
    return this.create({ label });
  }

  static textWithQuery(
    label: string,
    query?: string | number,
  ): TreeItemBuilder {
    return this.create({
      label,
      query: typeof query === 'string' ? query : label,
      includeInFilterSuggestions: true,
      actionIcon: ICON_SQUARE_ARROW_RIGHT,
    });
  }

  static items(label: string, children: ItemOrBuilder[]): TreeItemBuilder {
    return this.create({
      label,
      open: false,
      children: buildTreeItems(children),
    });
  }

  static list(label: string, strings: string[]): TreeItemBuilder {
    return this.items(
      label,
      strings.map((string) => this.text(string)),
    );
  }

  static linkOrText(label: string, href?: string): TreeItemBuilder {
    return href
      ? this.text(label).asLink(href)
      : this.text(label).includeInFilterSuggestions();
  }

  static lazy(
    item: TreeItem,
    loadItem: () => Promise<TreeItem | null>,
  ): TreeItem {
    return {
      ...item,
      children: undefined,
      childrenLoaded: false,
      hasChildren: true,
      loadChildren: loadItem,
    };
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
    this.item.childrenCount = this.item.children?.length;
    return this;
  }

  addChild(child?: ItemOrBuilder): this {
    if (!child) {
      return this;
    }
    if (!this.item.children) {
      this.item.children = [];
    }
    this.item.children.push(buildTreeItem(child));
    this.item.childrenCount = this.item.children.length;
    return this;
  }

  addChildren(children: Array<ItemOrBuilder | undefined>): this {
    children.forEach((child) => this.addChild(child));
    return this;
  }

  add(...children: Array<ItemOrBuilder | undefined>): this {
    return this.addChildren(children);
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

  asLink(href: string, actionIcon?: string): this {
    return this.withHref(href).withActionIcon(actionIcon ?? ICON_EXTERNAL_LINK);
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

  withLayout(layout: TreeItemLayout): this {
    this.item.layout = layout;
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

  withActionIcon(actionIcon: string): this {
    this.item.actionIcon = actionIcon;
    return this;
  }

  makeCopyable(copyContent?: string): this {
    return this.withActionIcon(ICON_CLIPBOARD_COPY).withOnClick(
      async (context) => {
        await copyToClipboard(copyContent ?? context.item.label ?? '');

        context.focusPath = context.item.path;
        context.refreshTree = false;
        context.showFeedback?.('Copied');
      },
    );
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

export function items(
  label: string,
  children: ItemOrBuilder[],
): TreeItemBuilder {
  return TreeItemBuilder.items(label, children);
}

export function text(label: string): TreeItemBuilder {
  return TreeItemBuilder.text(label);
}

export function link(
  label: string,
  href: string,
  actionIcon?: string,
): TreeItemBuilder {
  return TreeItemBuilder.text(label).asLink(href, actionIcon);
}

export function list(label: string, strings: string[]): TreeItemBuilder {
  return TreeItemBuilder.list(label, strings);
}

function buildTreeItem(item: ItemOrBuilder): TreeItem {
  if (item instanceof TreeItemBuilder) {
    return item.build();
  }
  return item;
}

function buildTreeItems(items: ItemOrBuilder[]): TreeItem[] {
  return items.map(buildTreeItem);
}
