// PageCollection.ts (content-script friendly)

import { bandcampPageData } from '../shared';
import type {
  CollectionPageData,
  FollowingFanItem,
  GenreItem,
} from '../types/CollectionPageData';

export type CollectionSummary = {
  tralbum_lookup: Record<string, { purchased?: boolean }>;
};

export type BandcampItem = {
  tralbum_type: string;
  tralbum_id: number;
  token: string;

  album_id: number;
  band_id: number;
  band_name: string;
  item_art_id: number;
  item_title: string;
  item_url: string;
  price: number;

  isFree?: boolean;
  isPurchased?: boolean;
  isWishlisted?: boolean;
};

export type FollowingBandItem = {
  band_id: number;
  image_id: number | null;
  art_id: number;
  url_hints: {
    subdomain: string;
    custom_domain: string | null;
  };
  name: string;
  is_following: boolean;
  is_subscribed: boolean | null;
  location: string | null;
  date_followed: string;
  token: string;
};

type ItemsResponse = {
  error?: boolean;
  error_message?: string;
  items: BandcampItem[];
  more_available: boolean;
  last_token?: string; // unreliable per original userscript
};

type SummaryResponse = {
  error?: boolean;
  error_message?: string;
  collection_summary?: CollectionSummary;
};

type FollowingBandsResponse = {
  error?: boolean;
  error_message?: string;
  followeers: FollowingBandItem[]; // Note: API has typo "followeers"
  more_available: boolean;
  last_token?: string;
};

export type LoadOptions = {
  pageSize?: number; // default 40
  includeSummaryFlags?: boolean; // default true
  signal?: AbortSignal;
};

interface BandcampTransport {
  getJson<T>(url: string, signal?: AbortSignal): Promise<T>;
  postJsonString<T>(
    url: string,
    payload: object,
    signal?: AbortSignal,
  ): Promise<T>;
}

/**
 * Content-script transport using fetch().
 * Runs in the page context (bandcamp.com), so same-origin requests usually work.
 */
export class FetchBandcampTransport implements BandcampTransport {
  async getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 300)}`);
    }

    return (await res.json()) as T;
  }

  /**
   * Matches the userscript: POST JSON string with x-www-form-urlencoded content-type.
   */
  async postJsonString<T>(
    url: string,
    payload: object,
    signal?: AbortSignal,
  ): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 300)}`);
    }

    return (await res.json()) as T;
  }
}

export class PageCollection {
  static readonly COLLECTION_SUMMARY_URL =
    'https://bandcamp.com/api/fan/2/collection_summary';
  static readonly COLLECTION_ITEMS_URL =
    'https://bandcamp.com/api/fancollection/1/collection_items';
  static readonly WISHLIST_ITEMS_URL =
    'https://bandcamp.com/api/fancollection/1/wishlist_items';
  static readonly FOLLOWING_BANDS_ITEMS_URL =
    'https://bandcamp.com/api/fancollection/1/following_bands';
  static readonly FOLLOWING_FANS_ITEMS_URL =
    'https://bandcamp.com/api/fancollection/1/following_fans_items';
  static readonly FOLLOWING_GENRES_ITEMS_URL =
    'https://bandcamp.com/api/fancollection/1/following_genres_items';

  private readonly doc: Document;
  private readonly transport: BandcampTransport;

  private pageData?: CollectionPageData;
  private summary?: CollectionSummary | null;

  constructor(args?: { doc?: Document; transport?: BandcampTransport }) {
    this.doc = args?.doc ?? document;
    this.transport = args?.transport ?? new FetchBandcampTransport();
  }

  /** Parse #pagedata[data-blob] once */
  getPageData(): CollectionPageData {
    if (this.pageData) return this.pageData;
    this.pageData = bandcampPageData.data as CollectionPageData;
    return this.pageData;
  }

  /** Same now-token trick as userscript */
  static makeNowToken(lastToken: string): string {
    const now = Math.floor(Date.now() / 1000);
    return lastToken.replace(/^\d+/, String(now));
  }

  async getCollectionSummary(opts?: {
    force?: boolean;
    signal?: AbortSignal;
  }): Promise<CollectionSummary | null> {
    if (!opts?.force && this.summary !== undefined) return this.summary;

    try {
      const json = await this.transport.getJson<SummaryResponse>(
        PageCollection.COLLECTION_SUMMARY_URL,
        opts?.signal,
      );
      this.summary = json.error ? null : (json.collection_summary ?? null);
    } catch {
      this.summary = null;
    }
    return this.summary;
  }

  private enrich(
    items: BandcampItem[],
    summary: CollectionSummary | null,
  ): BandcampItem[] {
    const lookup = summary?.tralbum_lookup ?? {};
    return items.map((item) => {
      const isFree = item.price === 0;

      const lookupKey = `${item.tralbum_type}${item.tralbum_id}`;
      const tralbum = lookup[lookupKey];

      const isPurchased = !!(tralbum && tralbum.purchased);
      const isWishlisted = !!(tralbum && !tralbum.purchased);

      return { ...item, isFree, isPurchased, isWishlisted };
    });
  }

  private async loadAllFromEndpoint(args: {
    endpointUrl: string;
    lastToken: string;
    options?: LoadOptions;
  }): Promise<BandcampItem[]> {
    const { endpointUrl, lastToken, options } = args;

    const pageSize = options?.pageSize ?? 40;
    const includeSummaryFlags = options?.includeSummaryFlags ?? true;

    const pageData = this.getPageData();
    const fanId = pageData.fan_data.fan_id;

    const summary = includeSummaryFlags
      ? await this.getCollectionSummary({ signal: options?.signal })
      : null;

    let olderThanToken = PageCollection.makeNowToken(lastToken);
    const all: BandcampItem[] = [];

    while (true) {
      if (options?.signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');

      const parsed = await this.transport.postJsonString<ItemsResponse>(
        endpointUrl,
        { fan_id: fanId, older_than_token: olderThanToken, count: pageSize },
        options?.signal,
      );

      if (parsed.error)
        throw new Error(
          parsed.error_message || 'Bandcamp API error while loading items.',
        );

      const batch = includeSummaryFlags
        ? this.enrich(parsed.items, summary)
        : parsed.items;
      all.push(...batch);

      if (!parsed.more_available) break;

      // Workaround from userscript: last_token can be wrong, use last item token
      const lastItem = parsed.items[parsed.items.length - 1];
      if (!lastItem?.token) break;
      olderThanToken = lastItem.token;
    }

    return all;
  }

  async loadWishlistItems(options?: LoadOptions): Promise<BandcampItem[]> {
    const lastToken = this.getPageData().wishlist_data?.last_token;
    if (!lastToken)
      throw new Error('This page does not contain wishlist_data.last_token.');

    return this.loadAllFromEndpoint({
      endpointUrl: PageCollection.WISHLIST_ITEMS_URL,
      lastToken,
      options,
    });
  }

  async loadCollectionItems(options?: LoadOptions): Promise<BandcampItem[]> {
    const lastToken = this.getPageData().collection_data?.last_token;
    if (!lastToken)
      throw new Error('This page does not contain collection_data.last_token.');

    return this.loadAllFromEndpoint({
      endpointUrl: PageCollection.COLLECTION_ITEMS_URL,
      lastToken,
      options,
    });
  }

  async loadFollowingBandsItems(
    options?: LoadOptions,
  ): Promise<FollowingBandItem[]> {
    const lastToken = this.getPageData().following_bands_data?.last_token;
    if (!lastToken)
      throw new Error(
        'This page does not contain following_bands_data.last_token.',
      );

    const pageSize = options?.pageSize ?? 40;
    const pageData = this.getPageData();
    const fanId = pageData.fan_data.fan_id;

    let olderThanToken = PageCollection.makeNowToken(lastToken);
    const all: FollowingBandItem[] = [];

    while (true) {
      if (options?.signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');

      const parsed =
        await this.transport.postJsonString<FollowingBandsResponse>(
          PageCollection.FOLLOWING_BANDS_ITEMS_URL,
          { fan_id: fanId, older_than_token: olderThanToken, count: pageSize },
          options?.signal,
        );

      if (parsed.error)
        throw new Error(
          parsed.error_message ||
            'Bandcamp API error while loading following bands.',
        );

      all.push(...parsed.followeers);

      if (!parsed.more_available) break;

      const lastItem = parsed.followeers[parsed.followeers.length - 1];
      if (!lastItem?.token) break;
      olderThanToken = lastItem.token;
    }

    return all;
  }

  async loadFollowingFansItems(): Promise<FollowingFanItem[]> {
    const pageData = this.getPageData();
    const fanIds = pageData.following_fans_data?.sequence ?? [];
    const cache = pageData.item_cache.following_fans ?? {};

    return fanIds
      .map((id) => cache[id])
      .filter((item): item is FollowingFanItem => Boolean(item));
  }

  async loadFollowingGenresItems(): Promise<GenreItem[]> {
    const pageData = this.getPageData();
    const genreIds = pageData.following_genres_data?.sequence ?? [];
    const cache = pageData.item_cache.following_genres ?? {};

    return genreIds
      .map((id) => cache[id])
      .filter((item): item is GenreItem => Boolean(item));
  }
}
