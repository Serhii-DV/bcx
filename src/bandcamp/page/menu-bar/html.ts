import { element } from 'src/utils/dom';

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
