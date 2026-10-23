import { describe, expect, it } from '@jest/globals';
import { defaultTimeFormatForCountry } from './time-format';

describe('defaultTimeFormatForCountry', () => {
  it('returns 12h for 12-hour-clock countries', () => {
    expect(defaultTimeFormatForCountry('US')).toBe(12);
    expect(defaultTimeFormatForCountry('ca')).toBe(12);
    expect(defaultTimeFormatForCountry(' au ')).toBe(12);
  });

  it('returns 24h for everyone else', () => {
    expect(defaultTimeFormatForCountry('FR')).toBe(24);
    expect(defaultTimeFormatForCountry('RU')).toBe(24);
    expect(defaultTimeFormatForCountry('')).toBe(24);
  });
});
