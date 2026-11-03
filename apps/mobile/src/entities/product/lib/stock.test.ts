import { describe, expect, it } from '@jest/globals';
import {
  contentUnitCost,
  filterProducts,
  fromPackages,
  monthChange,
  purchaseTotals,
  rebaseAmount,
  shelfValue,
  stockDelta,
  toPackages,
  visitsLeft,
} from './stock';

describe('contentUnitCost', () => {
  it('divides the package price by its size', () => {
    expect(contentUnitCost(630, 500)).toBe(1.26);
  });

  it('is unknown without a price or a size', () => {
    expect(contentUnitCost(null, 500)).toBeNull();
    expect(contentUnitCost(630, null)).toBeNull();
    expect(contentUnitCost(630, 0)).toBeNull();
  });

  it('is unknown when it would show as zero money', () => {
    expect(contentUnitCost(1, 1000)).toBeNull();
  });
});

describe('toPackages and fromPackages', () => {
  it('shows an amount as packages', () => {
    expect(toPackages(48, 10)).toBe(4.8);
    expect(toPackages(5, 1)).toBe(5);
  });

  it('turns packages back into an amount', () => {
    expect(fromPackages(4.8, 10)).toBe(48);
    expect(fromPackages(5, 1)).toBe(5);
  });
});

describe('rebaseAmount', () => {
  it('keeps the number while the meaning stays', () => {
    expect(rebaseAmount(5, null, null)).toBe(5);
    expect(rebaseAmount(48, 10, 10)).toBe(48);
  });

  it('keeps the amount when only the size is corrected', () => {
    expect(rebaseAmount(50, 10, 20)).toBe(50);
  });

  it('turns a count into an amount when the content is added', () => {
    expect(rebaseAmount(5, null, 10)).toBe(50);
  });

  it('turns an amount back into a count when the content is removed', () => {
    expect(rebaseAmount(48, 10, null)).toBe(4.8);
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
    expect(stockDelta(3.3, 3.1, 1)).toBe(0.2);
  });

  it('is nothing when the shown value did not change', () => {
    expect(stockDelta(0.97, 29, 30)).toBe(0);
  });

  it('adds a whole package to an amount that does not divide evenly', () => {
    expect(stockDelta(1.97, 29, 30)).toBe(30);
  });
});

describe('shelfValue', () => {
  it('prices packages, not stored amounts, and skips what has no price', () => {
    expect(
      shelfValue([
        { stock: 50, pack_size: 10, buy_price: 630 },
        { stock: 4, pack_size: 1, buy_price: 100 },
        { stock: 9, pack_size: 1, buy_price: null },
      ]),
    ).toBe(3550);
  });
});

describe('visitsLeft', () => {
  it('is unknown when no service uses it', () => {
    expect(visitsLeft({ stock: 10, services: [] })).toBeNull();
  });

  it('counts whole visits on the average use', () => {
    expect(visitsLeft({ stock: 48, services: [{ quantity: 2 }] })).toBe(24);
    expect(visitsLeft({ stock: 10, services: [{ quantity: 1 }, { quantity: 3 }] })).toBe(5);
    expect(visitsLeft({ stock: 1, services: [{ quantity: 2 }] })).toBe(0);
  });
});

describe('purchaseTotals', () => {
  it('splits by the month start and counts no price as nothing', () => {
    const start = '2026-11-01T00:00:00.000+06:00';
    expect(
      purchaseTotals(
        [
          { amount: 630, created_at: '2026-11-02T10:00:00Z' },
          { amount: 100, created_at: '2026-10-31T17:59:00Z' },
          { amount: 50, created_at: '2026-10-31T18:01:00Z' },
          { amount: null, created_at: '2026-11-03T10:00:00Z' },
        ],
        start,
      ),
    ).toEqual({ current: 680, previous: 100 });
  });
});

describe('monthChange', () => {
  it('compares to last month in whole percent', () => {
    expect(monthChange(92, 100)).toBe(-8);
    expect(monthChange(150, 100)).toBe(50);
  });

  it('says nothing with no base or no change', () => {
    expect(monthChange(100, 0)).toBeNull();
    expect(monthChange(100, 100)).toBeNull();
  });
});
