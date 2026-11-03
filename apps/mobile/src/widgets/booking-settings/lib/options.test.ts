import { describe, expect, it } from '@jest/globals';
import { isBookingOption, optionValues } from './options';

describe('optionValues', () => {
  it('offers the list', () => {
    expect(optionValues('horizon', 14)).toEqual([7, 14, 30, 60, 90]);
  });
  it('keeps a saved value that is off the list, in order', () => {
    expect(optionValues('horizon', 21)).toEqual([7, 14, 21, 30, 60, 90]);
  });
});

describe('isBookingOption', () => {
  it('reads a route param', () => {
    expect(isBookingOption('notice')).toBe(true);
    expect(isBookingOption('other')).toBe(false);
    expect(isBookingOption(undefined)).toBe(false);
  });
});
