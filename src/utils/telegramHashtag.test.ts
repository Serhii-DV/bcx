import { describe, expect, it } from '@rstest/core';
import { formatTelegramHashtag } from './telegramHashtag';

describe('formatTelegramHashtag', () => {
  it('spells out ampersands and preserves the artist name and case', () => {
    expect(formatTelegramHashtag('Boys & Girls')).toBe('#Boys_And_Girls');
    expect(formatTelegramHashtag('A&B')).toBe('#A_And_B');
  });

  it('collapses whitespace and punctuation into underscores', () => {
    expect(formatTelegramHashtag('  #Band__Name / Live! 🎵  ')).toBe(
      '#Band_Name_Live',
    );
  });

  it('normalizes accents and preserves Unicode letters and decimal digits', () => {
    expect(formatTelegramHashtag('Cafe\u0301 東京 １２３')).toBe(
      '#Café_東京_１２３',
    );
    expect(formatTelegramHashtag('1975 Band')).toBe('#1975_Band');
  });

  it('returns no hashtag for empty, symbol-only, or numeric names', () => {
    expect(formatTelegramHashtag('')).toBeUndefined();
    expect(formatTelegramHashtag(' #?! 🎵 ')).toBeUndefined();
    expect(formatTelegramHashtag('123 ４５６')).toBeUndefined();
  });

  it('limits the hashtag to 256 Unicode code points after the hash', () => {
    const artist = '𐐀'.repeat(256);
    expect(formatTelegramHashtag(`${artist}Z`)).toBe(`#${artist}`);
  });

  it('removes a separator exposed by truncation', () => {
    const artist = 'A'.repeat(255);
    expect(formatTelegramHashtag(`${artist} B`)).toBe(`#${artist}`);
  });

  it('returns no hashtag when the only letter is beyond the length limit', () => {
    expect(formatTelegramHashtag(`${'1'.repeat(256)}A`)).toBeUndefined();
  });
});
