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
  query: string,
  className?: string,
): HTMLElement {
  const badge = createElement(
    `<span class="bcx-badge ${className}" title="Filter by: ${query}" data-search-query="${query}">${query}</span>`,
  ) as HTMLElement;

  handleSearchBadgeOnClick(badge);

  return badge;
}

export function createReleaseYearElement(
  year: number,
  publishedDate: string,
): HTMLElement {
  return createElement(
    `<div class="bcx-release-year" title="${publishedDate}">${year}</div>`,
  ) as HTMLElement;
}
