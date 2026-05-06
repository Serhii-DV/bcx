import { beforeEach, describe, expect, it } from '@rstest/core';
import { markAppSetupStart, measureAppMount } from './performance';

describe('performance utilities', () => {
  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
  });

  it('marks app setup start and returns the mark name', () => {
    const markName = markAppSetupStart('popup');

    expect(markName).toBe('popup:setup-start');
    expect(performance.getEntriesByName('popup:setup-start')).toHaveLength(1);
  });

  it('returns the mounted app and records synchronous mount timing', () => {
    const app = { mounted: true };
    const result = measureAppMount({ label: 'popup' }, () => app);

    expect(result).toBe(app);
    expect(performance.getEntriesByName('popup:mount-sync')).toHaveLength(1);
  });
});
