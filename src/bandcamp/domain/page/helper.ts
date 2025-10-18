import { createElement } from 'src/utils/dom';
import './styles/bcx_release_info.css';

export function createReleaseYearElement(
  year: number,
  publishedDate: string,
): HTMLElement {
  return createElement(
    `<span class="bcx-release-year" title="${publishedDate}">${year}</span>`,
  ) as HTMLElement;
}
