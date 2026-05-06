import './styles/bcx.css';
import { musicFilterStore } from 'src/features/bcx/stores/musicFilter';
import { createElement, onClick } from 'src/utils/dom';

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

export function createQueryCountString(query: string, count: number): string {
  return query + (count ? ` (${count})` : '');
}

export function createQueryCountBadgeElement(
  query: string,
  count: number,
  title: string,
  className?: string,
): HTMLElement {
  const value = createQueryCountString(query, count);
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
