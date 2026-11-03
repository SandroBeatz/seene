import { describe, expect, it } from '@jest/globals';
import { filterProducts, linkedSummary, parseQuantity, stepQuantity, stockDelta } from './products';

const products = [
  { name: 'Гель-лак', type: 'work', stock: 3, low_stock: 5 },
  { name: 'Бафы', type: 'work', stock: 20, low_stock: 5 },
  { name: 'Крем для рук', type: 'sale', stock: 4, low_stock: 0 },
];
const names = (list: { name: string }[]) => list.map((p) => p.name);

describe('filterProducts', () => {
  it('filters by type', () => {
    expect(names(filterProducts(products, { query: '', type: 'sale', lowOnly: false }))).toEqual([
      'Крем для рук',
    ]);
  });

  it('keeps only what runs low; exactly at the threshold is not low', () => {
    const atLimit = [...products, { name: 'Пилки', type: 'work', stock: 5, low_stock: 5 }];
    expect(names(filterProducts(atLimit, { query: '', type: 'all', lowOnly: true }))).toEqual([
      'Гель-лак',
    ]);
  });

  it('searches in any case', () => {
    expect(
      names(filterProducts(products, { query: ' КРЕМ', type: 'all', lowOnly: false })),
    ).toEqual(['Крем для рук']);
  });
});

describe('parseQuantity', () => {
  it('reads a comma and rounds to what is stored', () => {
    expect(parseQuantity('1,5')).toBe(1.5);
    expect(parseQuantity('2.345')).toBe(2.35);
  });

  it('refuses what cannot be a quantity', () => {
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

describe('stockDelta', () => {
  it('does not carry float noise', () => {
    expect(stockDelta(3.3, 3.1)).toBe(0.2);
  });
});

describe('linkedSummary', () => {
  it('names one and counts the rest', () => {
    expect(linkedSummary([])).toBe('');
    expect(linkedSummary(['Маникюр'])).toBe('Маникюр');
    expect(linkedSummary(['Маникюр', 'Педикюр', 'Снятие'])).toBe('Маникюр + 2');
  });
});
