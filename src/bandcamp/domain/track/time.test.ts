import { describe, expect, it } from '@rstest/core';
import { TrackTime } from './time';

describe('TrackTime', () => {
  it('formats padded and readable time strings', () => {
    const time = new TrackTime(1, 2, 3);

    expect(time.toString()).toBe('01:02:03');
    expect(time.toReadableString()).toBe('1:02:03');
    expect(new TrackTime(0, 4, 5).toReadableString()).toBe('4:05');
    expect(new TrackTime(0, 0, 9).toReadableString()).toBe('0:09');
  });

  it('parses strict HH:MM:SS strings', () => {
    expect(TrackTime.fromString('02:03:04')).toEqual(new TrackTime(2, 3, 4));
    expect(() => TrackTime.fromString('2:03')).toThrow(
      'Invalid time format. Please use HH:MM:SS. Got: 2:03',
    );
  });

  it('parses ISO-8601 duration fragments', () => {
    expect(TrackTime.fromDuration('PT1H2M3S')).toEqual(new TrackTime(1, 2, 3));
    expect(TrackTime.fromDuration('PT45S')).toEqual(new TrackTime(0, 0, 45));
    expect(TrackTime.fromDuration('')).toBeUndefined();
  });
});
