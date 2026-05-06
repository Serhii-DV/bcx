import { copyToClipboard } from 'src/utils/clipboard';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
  type TreeItemClickContext,
  type TreeItemLayout,
} from './TreeItem';
import type { TreeItemButton } from './TreeItemButton';
import {
  ICON_CLIPBOARD,
  ICON_EXTERNAL_LINK,
  ICON_FILE_TEXT,
  ICON_FUNNEL_PLUS,
  ICON_LINK,
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

  withChildrenImage(image: string): this {
    this.item.children?.forEach((child) => {
      child.image = image;
    });
    return this;
  }

  withHint(hint: string): this {
    this.item.hint = hint;
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

  asTree(): this {
    return this.withLayout(TREE_ITEM_LAYOUT.TREE);
  }

  asBrowser(): this {
    return this.withLayout(TREE_ITEM_LAYOUT.BROWSER);
  }

  withButtons(buttons: TreeItemButton[]): this {
    this.item.buttons = buttons;
    return this;
  }

  addButton(button: TreeItemButton): this {
    if (!this.item.buttons) {
      this.item.buttons = [];
    }
    this.item.buttons.push(button);
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
    const content = copyContent ?? this.item.label ?? '';

    return this.withActionIcon(ICON_CLIPBOARD)
      .withOnClick(async (context) => {
        await copyToClipboard(content);

        context.focusPath = context.item.path;
        context.refreshTree = false;
        context.showFeedback?.('Copied');
      })
      .withHint(`Click to copy: ${content}`);
  }

  makeLazy(loadItem: () => Promise<TreeItem | null>): this {
    this.item.children = undefined;
    this.item.childrenLoaded = false;
    this.item.hasChildren = true;
    this.item.loadChildren = loadItem;
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

export function items(
  label: string,
  children: ItemOrBuilder[],
): TreeItemBuilder {
  return new TreeItemBuilder({
    label,
    open: false,
    children: buildTreeItems(children),
  });
}

export function builder(item: TreeItem): TreeItemBuilder {
  return new TreeItemBuilder(item);
}

export function item(label: string): TreeItemBuilder {
  return new TreeItemBuilder({ label });
}

export function text(label: string): TreeItemBuilder {
  return item(label).withImage(ICON_FILE_TEXT);
}

export function copyable(label: string, copyContent?: string): TreeItemBuilder {
  return text(label).makeCopyable(copyContent);
}

export function searchQuery(
  label: string,
  query?: string | number,
): TreeItemBuilder {
  const queryString = query !== undefined ? String(query) : label;
  return item(label)
    .withQuery(queryString)
    .withHint(`Search for "${queryString}"`)
    .includeInFilterSuggestions()
    .withImage(ICON_FUNNEL_PLUS)
    .withActionIcon(ICON_SQUARE_ARROW_RIGHT);
}

export function link(
  label: string,
  href: string,
  actionIcon?: string,
): TreeItemBuilder {
  return text(label).asLink(href, actionIcon).withImage(ICON_LINK);
}

export function linkOpen(label: string, href: string): TreeItemBuilder {
  return link(label, href, ICON_EXTERNAL_LINK).withHint(label);
}

export function linkOpenPage(pageName: string, href: string): TreeItemBuilder {
  return link(`Open page: ${pageName}`, href, ICON_EXTERNAL_LINK).withHint(
    `Open page: ${pageName}`,
  );
}

export function list(label: string, strings: string[]): TreeItemBuilder {
  return items(
    label,
    strings.map((string) => text(string)),
  );
}

export function linkOrText(label: string, href?: string): TreeItemBuilder {
  return href ? link(label, href) : text(label).includeInFilterSuggestions();
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
