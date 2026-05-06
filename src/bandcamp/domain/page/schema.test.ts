import { describe, expect, it } from '@rstest/core';
import { getPropertyValueByName } from './schema';

describe('schema helpers', () => {
  it('returns property values by name', () => {
    expect(
      getPropertyValueByName(
        [
          { name: 'art_id', value: 123 },
          { name: 'item_id', value: 456 },
        ],
        'item_id',
      ),
    ).toBe(456);
  });

  it('returns undefined for missing properties', () => {
    expect(getPropertyValueByName([], 'missing')).toBeUndefined();
    expect(getPropertyValueByName(undefined, 'missing')).toBeUndefined();
  });
});
