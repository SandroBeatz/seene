import { describe, expect, it } from '@jest/globals';
import { colorAfterDirectionChange, directionColor, nextSortOrder, parsePrice } from './draft';

describe('parsePrice', () => {
  it('reads whole and decimal amounts', () => {
    expect(parsePrice('1800')).toBe(1800);
    expect(parsePrice('1800,5')).toBe(1800.5);
    expect(parsePrice(' 99.90 ')).toBe(99.9);
  });

  it('treats empty as no price and rejects the rest', () => {
    expect(parsePrice('')).toBe(0);
    expect(parsePrice('12a')).toBeNull();
    expect(parsePrice('1.234')).toBeNull();
  });
});

describe('colorAfterDirectionChange', () => {
  it('follows the direction when the colour was the direction’s', () => {
    expect(colorAfterDirectionChange(directionColor('manicure'), 'manicure', 'tattoo')).toBe(
      directionColor('tattoo'),
    );
  });

  it('keeps a colour the master picked', () => {
    const picked = directionColor('lashes');
    expect(colorAfterDirectionChange(picked, 'manicure', 'tattoo')).toBe(picked);
  });
});

describe('nextSortOrder', () => {
  it('goes after the last one', () => {
    expect(nextSortOrder([])).toBe(1);
    expect(nextSortOrder([{ sort_order: 4 }, { sort_order: 2 }])).toBe(5);
  });
});
