import { element } from 'src/utils/dom';
import type { PageContext } from '../types/PageContext';

const menuBar = element('menu-bar');

export function getMenuBar(): HTMLElement | null {
  return menuBar;
}

export function getMenuBarFeedButton(): HTMLElement | null {
  return element('.feed>a', menuBar?.shadowRoot);
}

export function getMenuBarCollectionButton(): HTMLElement | null {
  return element('.collection>a', menuBar?.shadowRoot);
}

export class MenuBar {
  private readonly menuBar: HTMLElement;
  private pageContext?: PageContext;

  constructor() {
    this.menuBar =
      element('menu-bar') ??
      (() => {
        throw new Error('Bandcamp menu-bar element not found.');
      })();
  }

  getPageContext(): PageContext | null {
    if (this.pageContext !== undefined) return this.pageContext;

    const attrValue = this.menuBar.getAttribute('page-context');
    if (!attrValue) throw new Error('menu-bar[page-context] missing.');

    this.pageContext = JSON.parse(attrValue) as PageContext;

    return this.pageContext;
  }
}
