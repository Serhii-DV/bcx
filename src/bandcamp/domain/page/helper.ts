import { createElement } from 'src/utils/dom';

export function createReleaseYearElement(
  year: number,
  publishedDate: string,
): HTMLElement {
  return createElement(
    `<small class="bcx bcx-release-year" title="${publishedDate}">(${year})</small>`,
  ) as HTMLElement;
}
