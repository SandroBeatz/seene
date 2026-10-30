import { describe, expect, it } from '@jest/globals';
import {
  defaultPhoneCountry,
  dialCode,
  formatPhone,
  nationalDisplay,
  phoneCallUrl,
  phoneCountry,
  resolvePhoneInput,
  toCanonicalPhone,
  whatsappUrl,
} from './index';

describe('phone', () => {
  it('formats canonical digits for display', () => {
    expect(formatPhone('996555123456')).toBe('+996 555 123 456');
    expect(formatPhone('')).toBe('');
  });

  it('builds call and WhatsApp links', () => {
    expect(phoneCallUrl('996555123456')).toBe('tel:+996555123456');
    expect(whatsappUrl('996555123456')).toBe('https://wa.me/996555123456');
    expect(whatsappUrl('996555123456', 'Привет & до встречи')).toBe(
      'https://wa.me/996555123456?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82%20%26%20%D0%B4%D0%BE%20%D0%B2%D1%81%D1%82%D1%80%D0%B5%D1%87%D0%B8',
    );
  });
});

describe('phone input', () => {
  it('reads a national number in the selected country, dropping the trunk prefix', () => {
    expect(resolvePhoneInput('0555 12 34 56', 'KG')).toEqual({
      country: 'KG',
      display: '555 123 456',
      canonical: '996555123456',
    });
    expect(resolvePhoneInput('8 916 123 45 67', 'RU').canonical).toBe('79161234567');
  });

  it('switches country when the number starts with +', () => {
    const state = resolvePhoneInput('+1 416 555 0182', 'KG');
    expect(state.country).toBe('CA');
    expect(state.canonical).toBe('14165550182');
  });

  it('keeps an incomplete number non-canonical', () => {
    expect(resolvePhoneInput('555 12', 'KG').canonical).toBe('');
    expect(resolvePhoneInput('', 'KG')).toEqual({ country: 'KG', display: '', canonical: '' });
  });

  it('validates canonical digits strictly', () => {
    expect(toCanonicalPhone('996555123456')).toBe('996555123456');
    expect(toCanonicalPhone('+996555123456')).toBeNull();
    expect(toCanonicalPhone('99655')).toBeNull();
  });

  it('shows a stored number without its dial code', () => {
    expect(nationalDisplay('996555123456')).toBe('555 123 456');
    expect(phoneCountry('996555123456')).toBe('KG');
    expect(dialCode('KG')).toBe('+996');
  });
});

describe('default phone country', () => {
  it('follows the master time zone first', () => {
    expect(defaultPhoneCountry('Asia/Bishkek', 'RU', 'US')).toBe('KG');
    expect(defaultPhoneCountry('Asia/Almaty', null, null)).toBe('KZ');
  });

  it('falls back to the profile country, then the device region', () => {
    expect(defaultPhoneCountry('America/Sao_Paulo', 'fr', 'US')).toBe('FR');
    expect(defaultPhoneCountry(undefined, null, 'de')).toBe('DE');
    expect(defaultPhoneCountry(undefined, 'zz', null)).toBe('KG');
  });
});
