import { Band } from 'src/bandcamp/domain/band/band';
import {
  itemId,
  readCurrentItems,
  readSavedItems,
} from 'src/bandcamp/domain/fanData/library';
import type { FollowingBandItem } from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { TreeItemButtonFactory } from '../buttons/factory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import {
  countryFlagCodeFromLocation,
  countryNameFromLocation,
} from '../utils/countryFlag';
import {
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_GLOBE,
  ICON_MAP_PIN,
} from '../utils/icon';

export class FollowingBandsTreeItem {
  static async create(username: string, fanId?: number): Promise<TreeItem> {
    const storedItems = await readSavedItems<FollowingBandItem>(
      'following-bands',
      fanId,
    );
    const item: TreeItem = {
      label: 'Following Bands',
      buttons: [
        TreeItemButtonFactory.createExternalLink(
          'Open Following Bands',
          BandcampUrlFactory.generateFollowingBandsUrl(username),
        ),
      ],
    };
    const current = new Set(
      (await readCurrentItems<FollowingBandItem>('following-bands', fanId)).map(
        itemId,
      ),
    );
    const latestItems = storedItems.map((item) =>
      this.createFollowingBandTreeItem(item, current.has(itemId(item))),
    );
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    const roots = [
      createOrderRoot('Latest added', latestItems),
      createOrderRoot(
        'A–Z',
        [...latestItems].sort((a, b) =>
          collator.compare(a.label ?? '', b.label ?? ''),
        ),
      ),
      createOrderRoot(
        'Z–A',
        [...latestItems].sort((a, b) =>
          collator.compare(b.label ?? '', a.label ?? ''),
        ),
      ),
    ];
    const yearsRoot = createYearsRoot(latestItems);
    if (yearsRoot) roots.push(yearsRoot);
    roots.push(createCountriesRoot(latestItems, collator));

    return {
      ...item,
      children: roots,
      childrenCount: roots.length,
    };
  }

  private static createFollowingBandTreeItem(
    item: FollowingBandItem,
    following: boolean,
  ): TreeItem {
    const band = Band.create(
      item.band_id,
      item.name,
      BandcampUrlFactory.generateBandUrlFromSubdomain(item.url_hints.subdomain),
      item.image_id as number,
    );

    const treeItem = BandTreeItemFactory.createWithPreview(band, {
      following,
      location: item.location ?? undefined,
    });
    const followedAt = toIsoDate(item.date_followed);

    return followedAt
      ? {
          ...treeItem,
          timestamp: { label: 'Followed', dateTime: followedAt },
        }
      : treeItem;
  }
}

function toIsoDate(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function createOrderRoot(label: string, items: TreeItem[]): TreeItem {
  return {
    label,
    children: items.map((item) => ({ ...item })),
    childrenCount: items.length,
    itemPreview: true,
  };
}

function createYearsRoot(items: TreeItem[]): TreeItem | null {
  const itemsByYear = new Map<number, TreeItem[]>();

  for (const item of items) {
    if (!item.timestamp) continue;
    const year = new Date(item.timestamp.dateTime).getUTCFullYear();
    if (!Number.isFinite(year)) continue;
    const yearItems = itemsByYear.get(year) ?? [];
    yearItems.push({ ...item, includeInFilterSuggestions: false });
    itemsByYear.set(year, yearItems);
  }

  const years = [...itemsByYear.keys()].sort((a, b) => b - a);
  if (!years.length) return null;

  return {
    label: 'Followed by Year',
    image: ICON_CALENDAR,
    children: years.map((year) => ({
      label: String(year),
      image: ICON_CALENDAR_DAYS,
      children: itemsByYear.get(year),
      childrenCount: itemsByYear.get(year)?.length,
    })),
    childrenCount: years.length,
    itemPreview: true,
    layout: TREE_ITEM_LAYOUT.BROWSER,
  };
}

function createCountriesRoot(
  items: TreeItem[],
  collator: Intl.Collator,
): TreeItem {
  const itemsByCountry = new Map<string, TreeItem[]>();

  for (const item of items) {
    const country = countryNameFromLocation(item.bandPreview?.location);
    const countryItems = itemsByCountry.get(country) ?? [];
    countryItems.push({ ...item, includeInFilterSuggestions: false });
    itemsByCountry.set(country, countryItems);
  }

  const countries = [...itemsByCountry.keys()].sort((a, b) =>
    a === 'Unknown country'
      ? 1
      : b === 'Unknown country'
        ? -1
        : collator.compare(a, b),
  );

  return {
    label: 'Countries',
    image: ICON_GLOBE,
    children: countries.map((country) => {
      const flagCode = countryFlagCodeFromLocation(country);
      return {
        label: country,
        flagCode,
        image: flagCode ? undefined : ICON_MAP_PIN,
        children: itemsByCountry.get(country),
        childrenCount: itemsByCountry.get(country)?.length,
      };
    }),
    childrenCount: countries.length,
    itemPreview: true,
    layout: TREE_ITEM_LAYOUT.BROWSER,
  };
}
