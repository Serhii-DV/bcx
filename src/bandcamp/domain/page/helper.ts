import { createElement } from 'src/utils/dom';

export function createReleaseYearElement(
  year: number,
  publishedDate: string,
): HTMLElement {
  return createElement(
    `<span class="bcx bcx-release-year" title="${publishedDate}">(${year})</span>`,
  ) as HTMLElement;
}
