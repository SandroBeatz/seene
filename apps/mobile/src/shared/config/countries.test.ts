import { describe, expect, it } from '@jest/globals';
import { isSupportedCountry } from 'libphonenumber-js';
import { countryName, PHONE_COUNTRIES } from './countries';
import { TIME_ZONES } from './time-zones';

describe('phone countries', () => {
  it('lists only countries the phone library knows, once each', () => {
    const codes = PHONE_COUNTRIES.map((entry) => entry.code);
    expect(codes.filter((code) => !isSupportedCountry(code))).toEqual([]);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('covers every country of the time zone picker', () => {
    const missing = [...new Set(TIME_ZONES.map((zone) => zone.country))].filter(
      (code) => !PHONE_COUNTRIES.some((entry) => entry.code === code),
    );
    expect(missing).toEqual([]);
  });

  it('names a country in the app language', () => {
    expect(countryName('KG', 'ru')).toBe('Кыргызстан');
    expect(countryName('KG', 'fr')).toBe('Kirghizistan');
    expect(countryName('ZW', 'en')).toBe('ZW');
  });
});
