import {
  Banknote,
  Building,
  Calendar,
  CalendarDays,
  ChevronRight,
  ChevronsDown,
  ClipboardCopy,
  CornerLeftUp,
  CornerRightUp,
  Disc,
  ExternalLink,
  FileText,
  Funnel,
  Headphones,
  Heart,
  History,
  Info,
  Library,
  Link,
  ListMusic,
  Mic,
  Search,
  SquareArrowRight,
  Tag,
  Tags,
} from '@lucide/svelte';

export const ICON_CHEVRON_RIGHT = 'chevron-right';
export const ICON_CORNER_LEFT_UP = 'corner-left-up';
export const ICON_CORNER_RIGHT_UP = 'corner-right-up';
export const ICON_BUILDING = 'building';
export const ICON_CALENDAR = 'calendar';
export const ICON_CALENDAR_DAYS = 'calendar-days';
export const ICON_DISC = 'disc';
export const ICON_EXTERNAL_LINK = 'external-link';
export const ICON_FUNNEL = 'funnel';
export const ICON_HEART = 'heart';
export const ICON_HISTORY = 'history';
export const ICON_INFO = 'info';
export const ICON_LIBRARY = 'library';
export const ICON_LIST_MUSIC = 'list-music';
export const ICON_MIC = 'mic';
export const ICON_SEARCH = 'search';
export const ICON_SQUARE_ARROW_RIGHT = 'square-arrow-right';
export const ICON_TAGS = 'tags';
export const ICON_TAG = 'tag';
export const ICON_HEADPHONES = 'headphones';
export const ICON_CLIPBOARD_COPY = 'clipboard-copy';
export const ICON_LINK = 'link';
export const ICON_FILE_TEXT = 'file-text';
export const ICON_BANKNOTE = 'banknote';
export const ICON_CHEVRONS_DOWN = 'chevrons-down';

export function makeIcon(iconName?: string): any {
  switch (iconName) {
    case ICON_BUILDING:
      return Building;
    case ICON_CALENDAR:
      return Calendar;
    case ICON_CALENDAR_DAYS:
      return CalendarDays;
    case ICON_CHEVRON_RIGHT:
      return ChevronRight;
    case ICON_CORNER_LEFT_UP:
      return CornerLeftUp;
    case ICON_CORNER_RIGHT_UP:
      return CornerRightUp;
    case ICON_DISC:
      return Disc;
    case ICON_EXTERNAL_LINK:
      return ExternalLink;
    case ICON_FUNNEL:
      return Funnel;
    case ICON_HEART:
      return Heart;
    case ICON_HISTORY:
      return History;
    case ICON_INFO:
      return Info;
    case ICON_LIBRARY:
      return Library;
    case ICON_LIST_MUSIC:
      return ListMusic;
    case ICON_MIC:
      return Mic;
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
    case ICON_CLIPBOARD_COPY:
      return ClipboardCopy;
    case ICON_LINK:
      return Link;
    case ICON_FILE_TEXT:
      return FileText;
    case ICON_BANKNOTE:
      return Banknote;
    case ICON_CHEVRONS_DOWN:
      return ChevronsDown;
    default:
      return undefined;
  }
}
