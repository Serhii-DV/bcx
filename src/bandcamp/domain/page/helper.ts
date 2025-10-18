import './styles/bcx.css';
import { createElement, onClick } from 'src/utils/dom';
import { musicFilterStore } from '$lib/stores/musicFilter';

export function createMetadataElement(): HTMLElement {
  return createElement(
    `<div class="bcx-release-metadata"></div>`,
  ) as HTMLElement;
}

function searchBadgeOnClick(badge: HTMLElement): void {
  onClick(badge, () => {
    const searchQuery = badge.getAttribute('data-search-query') || '';
    musicFilterStore.setSearchQuery(searchQuery);
  });
}

export function createReleaseYearBadgeElement(year: number): HTMLElement {
  const badge = createElement(
    `<span class="bcx-badge bcx-release-year" title="Search by year: ${year}" data-search-query="${year}">${year}</span>`,
  ) as HTMLElement;

  searchBadgeOnClick(badge);

  return badge;
}

export function createReleaseArtistBadgeElement(artist: string): HTMLElement {
  const badge = createElement(
    `<span class="bcx-badge bcx-release-artist" title="Search by artist: ${artist}" data-search-query="${artist}">${artist}</span>`,
  ) as HTMLElement;

  searchBadgeOnClick(badge);

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
