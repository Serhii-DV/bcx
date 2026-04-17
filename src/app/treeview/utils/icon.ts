import { ExternalLink, Funnel, Search, SquareArrowRight } from '@lucide/svelte';

export const ICON_EXTERNAL_LINK = 'external-link';
export const ICON_FUNNEL = 'funnel';
export const ICON_SEARCH = 'search';
export const ICON_SQUARE_ARROW_RIGHT = 'square-arrow-right';

export function makeIcon(actionIcon?: string): any {
  switch (actionIcon) {
    case ICON_EXTERNAL_LINK:
      return ExternalLink;
    case ICON_FUNNEL:
      return Funnel;
    case ICON_SEARCH:
      return Search;
    case ICON_SQUARE_ARROW_RIGHT:
      return SquareArrowRight;
    default:
      return undefined;
  }
}
