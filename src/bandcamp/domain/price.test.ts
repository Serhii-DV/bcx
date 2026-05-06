import { beforeEach, describe, expect, it } from '@rstest/core';

function installChromeMock() {
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      storage: {
        local: {},
        session: {},
      },
    },
    configurable: true,
  });
}

describe('Price', () => {
  beforeEach(() => {
    installChromeMock();
  });

  it('creates prices from string amounts', async () => {
    const { Price } = await import('./price');
    const price = Price.create('12.5', 'USD');

    expect(price.amount).toBe(12.5);
    expect(price.currency).toBe('USD');
    expect(price.toString()).toBe('12.5 USD');
    expect(price.isZero()).toBe(false);
  });

  it('detects zero prices', async () => {
    const { Price } = await import('./price');

    expect(Price.create(0, 'EUR').isZero()).toBe(true);
  });

  it('round-trips through storage object compression', async () => {
    const { Price } = await import('./price');
    const price = Price.create(5, 'GBP');
    const restored = Price.fromStorageObject(price.toStorageObject());

    expect(restored.toRawData()).toEqual(price.toRawData());
  });
});
