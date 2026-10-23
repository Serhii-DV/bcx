import type { RawMetadataData } from 'src/bandcamp/domain/metadata';
import type { BandcampItem } from 'src/bandcamp/domain/page/PageCollection';
import type { RawPriceData } from 'src/bandcamp/domain/price';

const NAME_YOUR_PRICE = 'name your price';

export function getFanItemPrice(
  item: Pick<BandcampItem, 'price' | 'currency'>,
): RawPriceData | undefined {
  return getReleasePrice({
    price: {
      amount: item.price,
      currency: typeof item.currency === 'string' ? item.currency : '',
    },
  });
}

export function getReleasePrice(
  metadata?: Pick<RawMetadataData, 'price' | 'release'>,
): RawPriceData | undefined {
  const price = metadata?.price;
  if (
    metadata?.release?.priceAvailable === false ||
    !price ||
    !Number.isFinite(price.amount) ||
    price.amount < 0
  )
    return undefined;
  const currency = price.currency.trim().toUpperCase();
  if (price.amount > 0 && !currency) return undefined;
  return { amount: price.amount, currency };
}

export function formatReleasePrice(price?: RawPriceData): string | undefined {
  if (!price) return undefined;
  return price.amount === 0
    ? NAME_YOUR_PRICE
    : `${price.amount} ${price.currency}`;
}
