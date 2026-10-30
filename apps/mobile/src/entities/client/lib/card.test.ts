import { describe, expect, it } from '@jest/globals';
import {
  clientName,
  isValidBirthday,
  normalizeInstagram,
  normalizeTelegram,
  telegramUrl,
} from './card';

describe('client card', () => {
  it('joins the name parts it has', () => {
    expect(clientName({ first_name: 'Айгерим', last_name: 'Касымова' })).toBe('Айгерим Касымова');
    expect(clientName({ first_name: 'Айгерим', last_name: null })).toBe('Айгерим');
  });

  it('reads a Telegram username from a handle or a link', () => {
    expect(normalizeTelegram('@aigerim_k')).toBe('aigerim_k');
    expect(normalizeTelegram('https://t.me/aigerim_k')).toBe('aigerim_k');
    expect(normalizeTelegram(' t.me/aigerim_k?start=1 ')).toBe('aigerim_k');
    expect(normalizeTelegram('@ab')).toBeNull();
    expect(normalizeTelegram('айгерим')).toBeNull();
    expect(telegramUrl('aigerim_k')).toBe('https://t.me/aigerim_k');
  });

  it('reads an Instagram username, lower-cased', () => {
    expect(normalizeInstagram('@Aigerim.K')).toBe('aigerim.k');
    expect(normalizeInstagram('https://www.instagram.com/aigerim.k/')).toBe('aigerim.k');
    expect(normalizeInstagram('aigerim k')).toBeNull();
  });

  it('accepts a day of a month in any year', () => {
    expect(isValidBirthday(29, 2)).toBe(true);
    expect(isValidBirthday(31, 4)).toBe(false);
    expect(isValidBirthday(14, 5)).toBe(true);
    expect(isValidBirthday(1, 13)).toBe(false);
  });
});
