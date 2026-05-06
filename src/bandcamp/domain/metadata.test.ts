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

describe('Metadata', () => {
  beforeEach(() => {
    installChromeMock();
  });

  it('creates date accessors from raw date strings', async () => {
    const { Metadata } = await import('./metadata');
    const { Price } = await import('./price');
    const metadata = Metadata.create(
      Price.create(7, 'USD'),
      'Example Publisher',
      '2024-02-03T10:20:30Z',
      '2024-03-04T11:22:33Z',
      ['ambient', 'drone'],
    );

    expect(metadata.year).toBe(2024);
    expect(metadata.publishedDate).toBe('2024-02-03');
    expect(metadata.modifiedDate).toBe('2024-03-04');
    expect(metadata.toRawData()).toMatchObject({
      publisher: 'Example Publisher',
      keywords: ['ambient', 'drone'],
    });
  });

  it('round-trips through storage object compression', async () => {
    const { Metadata } = await import('./metadata');
    const { Price } = await import('./price');
    const metadata = Metadata.create(
      Price.create(0, 'EUR'),
      'Publisher',
      '2020-01-01',
      '2020-01-02',
      ['tag'],
    );

    const restored = Metadata.fromStorageObject(metadata.toStorageObject());

    expect(restored.toRawData()).toEqual(metadata.toRawData());
  });
});
