import type { ReleaseInformation } from 'src/features/treeview/ReleasePreview';
import type { TreeItem } from 'src/features/treeview/TreeItem';

export interface ReleaseFilterOption {
  label: string;
  query: string;
}

export function getReleaseFilterOptions(
  information: ReleaseInformation,
  price?: string,
): ReleaseFilterOption[] {
  const year =
    information.releaseYear ??
    (information.date
      ? new Date(information.date).getUTCFullYear()
      : undefined);
  const values: [string, string | undefined][] = [
    [
      'Year',
      year && Number.isInteger(year) && year > 0 ? String(year) : undefined,
    ],
    ['Price', price],
  ];
  return values.flatMap(([field, value]) => {
    const trimmed = value?.trim();
    if (!trimmed) return [];
    const label = `${field}: ${trimmed}`;
    return [{ label, query: label }];
  });
}

export function matchesReleaseFilter(
  item: TreeItem,
  query: string,
): boolean | undefined {
  const match = /^(year|price):\s*(.+)$/i.exec(query.trim());
  if (!match) return undefined;
  const information = item.previewInformation;
  if (!information) return false;
  const value = match[2].trim().toLocaleLowerCase();
  return getReleaseFilterOptions(information, item.price).some(
    (option) =>
      option.query.toLocaleLowerCase() ===
      `${match[1].toLocaleLowerCase()}: ${value}`,
  );
}
