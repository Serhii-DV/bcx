export interface SectionNavigationItem {
  id: string;
  label: string;
  image?: string;
  title?: string;
  contentId: string;
  sortOptions?: { id: string; label: string; title?: string }[];
  sortValue?: string;
  sortLabel?: string;
  onSortChange?: (id: string) => void;
}

export interface SectionNavigation {
  items: SectionNavigationItem[];
  value: string;
  select: (id: string) => void;
}

export function isSectionItemSelected(
  item: SectionNavigationItem,
  value: string,
): boolean {
  return (
    item.id === value ||
    (!item.onSortChange &&
      !!item.sortOptions?.some((option) => option.id === value))
  );
}
