import { hasFlag } from 'country-flag-icons';
import { Band } from 'src/bandcamp/domain/band/band';
import {
  type FollowingBandItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';
import {
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_GLOBE,
  ICON_MAP_PIN,
} from '../utils/icon';
import { createStoredFanListTreeItem } from './createStoredFanListTreeItem';

const FOLLOWING_BANDS_KEY = '/following-bands';
const countryCodesByName = createCountryCodesByName();

export class FollowingBandsTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const item = await createStoredFanListTreeItem<FollowingBandItem>({
      label: 'Following Bands',
      openButtonLabel: 'Open Following Bands',
      openUrl: BandcampUrlFactory.generateFollowingBandsUrl(username),
      refreshButtonLabel: 'Refresh Following Bands',
      storageKey: FOLLOWING_BANDS_KEY,
      username,
      loadItems: loadFollowingBands,
      createTreeItem: (item) => this.createFollowingBandTreeItem(item),
    });
    const latestItems = item.children ?? [];
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
  ): TreeItem {
    const band = Band.create(
      item.band_id,
      item.name,
      BandcampUrlFactory.generateBandUrlFromSubdomain(item.url_hints.subdomain),
      item.image_id as number,
    );

    const treeItem = BandTreeItemFactory.createWithPreview(band, {
      following: true,
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
    const location = item.bandPreview?.location?.trim();
    const country = location?.split(',').at(-1)?.trim() || 'Unknown country';
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
      const flagCode = countryFlagCode(country);
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

function createCountryCodesByName(): Map<string, string> {
  const displayNames = new Intl.DisplayNames(['en'], {
    type: 'region',
    fallback: 'none',
  });
  const codesByName = new Map<string, string>();

  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second);
      const name = displayNames.of(code);
      if (name && hasFlag(code)) {
        codesByName.set(name.toLocaleLowerCase('en'), code);
      }
    }
  }

  codesByName.set('usa', 'US');
  codesByName.set('united states of america', 'US');
  codesByName.set('uk', 'GB');
  return codesByName;
}

function countryFlagCode(country: string): string | undefined {
  return countryCodesByName.get(country.toLocaleLowerCase('en'));
}

async function loadFollowingBands(): Promise<FollowingBandItem[]> {
  const pageCollection = new PageCollection();
  return pageCollection.loadFollowingBandsItems({
    includeSummaryFlags: false,
  });
}
