import type { RawMetadataData } from 'src/bandcamp/domain/metadata';
import type { RawPriceData } from 'src/bandcamp/domain/price';

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
    ? 'name your price'
    : `${price.amount} ${price.currency}`;
}
