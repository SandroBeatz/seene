import { describe, expect, it } from '@jest/globals';
import {
  currencySymbol,
  formatAmount,
  formatDate,
  formatDuration,
  formatPrice,
  formatTime,
  isSameCalendarDay,
} from './index';

const utc = '2026-08-19T12:30:00.000Z';

describe('formats', () => {
  it('formats time in 24h and 12h in the target zone', () => {
    expect(formatTime(utc, { zone: 'Europe/Paris', timeFormat: 24 })).toBe('14:30');
    expect(formatTime(utc, { zone: 'Europe/Paris', timeFormat: 12 })).toBe('2:30 PM');
    expect(formatTime(utc, { zone: 'America/New_York', timeFormat: 24 })).toBe('08:30');
  });

  it('formats dates with the settings token', () => {
    expect(formatDate(utc, { zone: 'Europe/Paris', dateFormat: 'DD/MM/YYYY', locale: 'en' })).toBe(
      '19/08/2026',
    );
    expect(formatDate(utc, { zone: 'Europe/Paris', dateFormat: 'MM/DD/YYYY', locale: 'en' })).toBe(
      '08/19/2026',
    );
    expect(formatDate(utc, { zone: 'Europe/Paris', dateFormat: 'YYYY-MM-DD', locale: 'en' })).toBe(
      '2026-08-19',
    );
  });

  it('formats prices per currency + locale', () => {
    expect(formatPrice(80, { currency: 'EUR', locale: 'fr' })).toContain('80');
    expect(formatPrice(80, { currency: 'USD', locale: 'en' })).toBe('$80.00');
  });

  it('formats service amounts without forced decimals', () => {
    expect(formatAmount(80, { currency: 'USD', locale: 'en' })).toBe('$80');
    expect(formatAmount(80.5, { currency: 'USD', locale: 'en' })).toBe('$80.5');
    expect(currencySymbol('USD', 'en')).toBe('$');
    expect(currencySymbol('XYZ_BAD', 'en')).toBe('XYZ_BAD');
    expect(currencySymbol('KGS', 'ru')).toBe('сом');
    expect(formatAmount(300, { currency: 'KGS', locale: 'ru' })).toBe('300 сом');
  });

  it('formats durations compactly', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(0)).toBe('0m');
  });

  it('compares calendar days within a zone', () => {
    // 18:00 UTC → 20:00 Paris, still the 19th
    expect(isSameCalendarDay(utc, '2026-08-19T18:00:00.000Z', 'Europe/Paris')).toBe(true);
    // 22:00 UTC → 00:00 Paris on the 20th
    expect(isSameCalendarDay(utc, '2026-08-19T22:00:00.000Z', 'Europe/Paris')).toBe(false);
  });
});
