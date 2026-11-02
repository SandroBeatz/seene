import { describe, expect, it } from '@jest/globals';
import { joinProfessions, profileLine } from './profile-line';

describe('joinProfessions', () => {
  it('returns nothing without professions', () => {
    expect(joinProfessions([], ' и ')).toBe('');
  });

  it('keeps a single profession as is', () => {
    expect(joinProfessions(['Маникюр'], ' и ')).toBe('Маникюр');
  });

  it('joins two with the conjunction and lowers the second', () => {
    expect(joinProfessions(['Маникюр', 'Педикюр'], ' и ')).toBe('Маникюр и педикюр');
  });

  it('separates the rest with commas', () => {
    expect(joinProfessions(['Маникюр', 'Педикюр', 'Брови'], ' и ')).toBe(
      'Маникюр, педикюр и брови',
    );
  });
});

describe('profileLine', () => {
  it('adds the city after a dot', () => {
    expect(profileLine('Маникюр', 'Бишкек')).toBe('Маникюр · Бишкек');
  });

  it('skips a missing or blank city', () => {
    expect(profileLine('Маникюр', null)).toBe('Маникюр');
    expect(profileLine('Маникюр', '  ')).toBe('Маникюр');
  });
});
