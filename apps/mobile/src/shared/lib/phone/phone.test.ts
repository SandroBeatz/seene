import { describe, expect, it } from '@jest/globals';
import { formatPhone, phoneCallUrl, whatsappUrl } from './index';

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
