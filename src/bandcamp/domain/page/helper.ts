import './styles/bcx.css';
import { createElement, onClick } from 'src/utils/dom';
import { musicFilterStore } from '$lib/stores/musicFilter';

export function createMetadataElement(): HTMLElement {
  return createElement(
    `<div class="bcx-release-metadata"></div>`,
  ) as HTMLElement;
}

function handleSearchBadgeOnClick(badge: HTMLElement): void {
  onClick(badge, () => {
    const searchQuery = badge.getAttribute('data-search-query') || '';
    musicFilterStore.setSearchQuery(searchQuery);
  });
}

export function createBadgeElement(
  value: string,
  query: string,
  title: string,
  className?: string,
): HTMLElement {
  const badge = createElement(
    `<span class="bcx-badge ${className ?? ''}" title="${title}" data-search-query="${query}">${value}</span>`,
  ) as HTMLElement;

  handleSearchBadgeOnClick(badge);

  return badge;
}

export function createQueryCountBadgeElement(
  query: string,
  count: number,
  title: string,
  className?: string,
): HTMLElement {
  const value = query + (count > 1 ? ` (${count})` : '');
  title += '\n' + query + '\n' + `On this page: ${count}`;
  return createBadgeElement(value, query, title, className);
}

export function createReleaseYearElement(
  year: number,
  publishedDate: string,
): HTMLElement {
  return createElement(
    `<div class="bcx-release-year" title="${publishedDate}">${year}</div>`,
  ) as HTMLElement;
}
