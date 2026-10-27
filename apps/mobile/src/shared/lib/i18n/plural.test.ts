import { describe, expect, it } from '@jest/globals';
import { pluralCategory } from './plural';

describe('pluralCategory', () => {
  it('follows Russian one/few/many', () => {
    expect([1, 21, 101].map((n) => pluralCategory(n, 'ru'))).toEqual(['one', 'one', 'one']);
    expect([2, 4, 22, 34].map((n) => pluralCategory(n, 'ru'))).toEqual(['few', 'few', 'few', 'few']);
    expect([0, 5, 11, 12, 14, 25, 111].map((n) => pluralCategory(n, 'ru'))).toEqual([
      'many', 'many', 'many', 'many', 'many', 'many', 'many',
    ]);
  });
  it('follows English and French one/other', () => {
    expect([pluralCategory(1, 'en'), pluralCategory(0, 'en'), pluralCategory(2, 'en')]).toEqual(['one', 'other', 'other']);
    expect([pluralCategory(0, 'fr'), pluralCategory(1, 'fr'), pluralCategory(2, 'fr')]).toEqual(['one', 'one', 'other']);
  });
});
