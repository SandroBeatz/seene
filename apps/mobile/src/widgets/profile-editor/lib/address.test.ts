import { describe, expect, it } from '@jest/globals';
import { addressLine } from './address';

describe('addressLine', () => {
  it('joins the city and the street with its house', () => {
    expect(addressLine({ city: 'Бишкек', address: 'Киевская', house_number: '95' })).toBe(
      'Бишкек, Киевская 95',
    );
  });

  it('skips what is missing', () => {
    expect(addressLine({ city: 'Бишкек', address: null, house_number: null })).toBe('Бишкек');
    expect(addressLine({ city: ' ', address: 'Киевская', house_number: null })).toBe('Киевская');
    expect(addressLine({ city: null, address: null, house_number: null })).toBe('');
  });
});
