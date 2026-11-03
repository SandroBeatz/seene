import { describe, expect, it } from '@jest/globals';
import { filterProducts, rebaseAmount, stockDelta, toPackages, unitCost } from './products';

describe('unitCost', () => {
  it('divides the package price by its size', () => {
    expect(unitCost(630, 500)).toBe(1.26);
  });

  it('is unknown without a price or a size', () => {
    expect(unitCost(null, 500)).toBeNull();
    expect(unitCost(630, null)).toBeNull();
    expect(unitCost(630, 0)).toBeNull();
  });

  it('is unknown when it would show as zero money', () => {
    expect(unitCost(1, 1000)).toBeNull();
  });
});

describe('toPackages', () => {
  it('shows an amount as packages', () => {
    expect(toPackages(48, 10)).toBe(4.8);
    expect(toPackages(5, 1)).toBe(5);
  });
});

describe('rebaseAmount', () => {
  const counted = { measured: false, packSize: 1 };
  const bottle = { measured: true, packSize: 10 };

  it('keeps the number while the meaning stays', () => {
    expect(rebaseAmount(5, counted, null)).toBe(5);
    expect(rebaseAmount(48, bottle, 10)).toBe(48);
  });

  it('keeps the amount when only the size is corrected', () => {
    expect(rebaseAmount(50, bottle, 20)).toBe(50);
  });

  it('turns a count into an amount when the content is added', () => {
    expect(rebaseAmount(5, counted, 10)).toBe(50);
  });

  it('turns an amount back into a count when the content is removed', () => {
    expect(rebaseAmount(48, bottle, null)).toBe(4.8);
  });
});

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

describe('stockDelta', () => {
  it('does not carry float noise', () => {
    expect(stockDelta(3.3, 3.1)).toBe(0.2);
  });
});
