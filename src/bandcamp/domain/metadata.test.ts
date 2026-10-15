import { describe, expect, it } from '@rstest/core';
import { Metadata } from './metadata';
import { Price } from './price';

describe('Metadata', () => {
  it('creates date accessors from raw date strings', () => {
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

  it('round-trips through raw data', () => {
    const metadata = Metadata.create(
      Price.create(0, 'EUR'),
      'Publisher',
      '2020-01-01',
      '2020-01-02',
      ['tag'],
    );

    const restored = Metadata.fromRawData(metadata.toRawData());

    expect(restored.toRawData()).toEqual(metadata.toRawData());

    const summary = Metadata.create(Price.create(5, 'EUR'), '', '', '');
    const restoredSummary = Metadata.fromRawData(summary.toRawData());
    expect(restoredSummary.year).toBeUndefined();
    expect(restoredSummary.publishedDate).toBe('');
    expect(restoredSummary.modifiedDate).toBe('');
    expect(restoredSummary.toRawData()).toEqual(summary.toRawData());
  });
});
