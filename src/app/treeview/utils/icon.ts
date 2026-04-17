import {
  ChevronRight,
  CornerLeftUp,
  CornerRightUp,
  ExternalLink,
  Funnel,
  Headphones,
  Heart,
  History,
  Library,
  Search,
  SquareArrowRight,
  Tag,
  Tags,
} from '@lucide/svelte';

export const ICON_CHEVRON_RIGHT = 'chevron-right';
export const ICON_CORNER_LEFT_UP = 'corner-left-up';
export const ICON_CORNER_RIGHT_UP = 'corner-right-up';
export const ICON_EXTERNAL_LINK = 'external-link';
export const ICON_FUNNEL = 'funnel';
export const ICON_HEART = 'heart';
export const ICON_HISTORY = 'history';
export const ICON_LIBRARY = 'library';
export const ICON_SEARCH = 'search';
export const ICON_SQUARE_ARROW_RIGHT = 'square-arrow-right';
export const ICON_TAGS = 'tags';
export const ICON_TAG = 'tag';
export const ICON_HEADPHONES = 'headphones';

export function makeIcon(iconName?: string): any {
  switch (iconName) {
    case ICON_CHEVRON_RIGHT:
      return ChevronRight;
    case ICON_CORNER_LEFT_UP:
      return CornerLeftUp;
    case ICON_CORNER_RIGHT_UP:
      return CornerRightUp;
    case ICON_EXTERNAL_LINK:
      return ExternalLink;
    case ICON_FUNNEL:
      return Funnel;
    case ICON_HEART:
      return Heart;
    case ICON_HISTORY:
      return History;
    case ICON_LIBRARY:
      return Library;
    case ICON_SEARCH:
      return Search;
    case ICON_SQUARE_ARROW_RIGHT:
      return SquareArrowRight;
    case ICON_TAGS:
      return Tags;
    case ICON_TAG:
      return Tag;
    case ICON_HEADPHONES:
      return Headphones;
    default:
      return undefined;
  }
}
