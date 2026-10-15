import { describe, expect, it } from '@rstest/core';
import { Price } from './price';

describe('Price', () => {
  it('creates prices from string amounts', () => {
    const price = Price.create('12.5', 'USD');

    expect(price.amount).toBe(12.5);
    expect(price.currency).toBe('USD');
    expect(price.toString()).toBe('12.5 USD');
    expect(price.isZero()).toBe(false);
  });

  it('detects zero prices', () => {
    expect(Price.create(0, 'EUR').isZero()).toBe(true);
  });

  it('round-trips through raw data', () => {
    const price = Price.create(5, 'GBP');
    const restored = Price.fromRawData(price.toRawData());

    expect(restored.toRawData()).toEqual(price.toRawData());
  });
});
