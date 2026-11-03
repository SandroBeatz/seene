import { describe, expect, it } from '@jest/globals';
import {
  linkedSummary,
  linksOfService,
  linksValid,
  parseQuantity,
  sameLinks,
  stepQuantity,
} from './quantity';

describe('parseQuantity', () => {
  it('reads a comma and rounds to hundredths', () => {
    expect(parseQuantity('1,5')).toBe(1.5);
    expect(parseQuantity('2.345')).toBe(2.35);
  });

  it('refuses what cannot be stored', () => {
    for (const text of ['', ' ', 'abc', '-1', '100000000']) {
      expect(parseQuantity(text)).toBeNull();
    }
  });
});

describe('stepQuantity', () => {
  it('steps and stops at zero', () => {
    expect(stepQuantity('3', 1)).toBe('4');
    expect(stepQuantity('0', -1)).toBe('0');
    expect(stepQuantity('0,5', -1)).toBe('0');
    expect(stepQuantity('1.5', 1)).toBe('2.5');
  });
});

describe('linkedSummary', () => {
  it('names one and counts the rest', () => {
    expect(linkedSummary([])).toBe('');
    expect(linkedSummary(['Маникюр'])).toBe('Маникюр');
    expect(linkedSummary(['Маникюр', 'Педикюр', 'Снятие'])).toBe('Маникюр + 2');
  });
});

describe('linksOfService', () => {
  it('finds what one service uses across products', () => {
    const products = [
      { id: 'lak', services: [{ service_id: 'a', quantity: 2 }] },
      { id: 'baf', services: [{ service_id: 'b', quantity: 1 }] },
      { id: 'oil', services: [] },
    ];
    expect(linksOfService(products, 'a')).toEqual({ lak: '2' });
    expect(linksOfService(products, 'none')).toEqual({});
  });
});

describe('linksValid', () => {
  it('needs an amount above zero on every link', () => {
    expect(linksValid({})).toBe(true);
    expect(linksValid({ lak: '1,5' })).toBe(true);
    expect(linksValid({ lak: '0' })).toBe(false);
    expect(linksValid({ lak: '' })).toBe(false);
  });
});

describe('sameLinks', () => {
  it('ignores how an amount was typed', () => {
    expect(sameLinks({ lak: '1,5' }, { lak: '1.5' })).toBe(true);
  });

  it('sees a changed amount, an added and a removed product', () => {
    expect(sameLinks({ lak: '1' }, { lak: '2' })).toBe(false);
    expect(sameLinks({ lak: '1' }, { lak: '1', oil: '1' })).toBe(false);
    expect(sameLinks({ lak: '1', oil: '1' }, { lak: '1' })).toBe(false);
    expect(sameLinks({ lak: '1' }, { oil: '1' })).toBe(false);
  });
});
