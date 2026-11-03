import { describe, expect, it } from '@jest/globals';
import { directionOrder, groupServices, withGroupOrder } from './grouping';

describe('withGroupOrder', () => {
  it('reorders the group in its own places and leaves the rest', () => {
    expect(withGroupOrder(['a', 'x', 'b', 'y', 'c'], ['c', 'a', 'b'])).toEqual([
      'c',
      'x',
      'a',
      'y',
      'b',
    ]);
  });
});

const service = (id: string, patch: Partial<Parameters<typeof groupServices>[0][number]> = {}) => ({
  id,
  name: id,
  sort_order: 0,
  is_active: true,
  specialization: 'manicure',
  category_id: null,
  ...patch,
});
const cat = (id: string, sort_order = 0) => ({ id, name: id, sort_order });

describe('groupServices', () => {
  it('orders directions: the master’s, then others in use, then none', () => {
    const groups = groupServices(
      [
        service('a', { specialization: null }),
        service('b', { specialization: 'tattoo' }),
        service('c', { specialization: 'pedicure' }),
        service('d'),
      ],
      [],
      ['pedicure', 'manicure'],
    );
    expect(groups.map((g) => g.specialization)).toEqual(['pedicure', 'manicure', 'tattoo', null]);
  });

  it('leaves deleted services out and drops empty groups', () => {
    const groups = groupServices(
      [service('a', { is_active: false, category_id: 'x' }), service('b')],
      [cat('x')],
      ['manicure', 'pedicure'],
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(1);
    expect(groups[0].categories.map((c) => c.category)).toEqual([null]);
  });

  it('sorts categories and their services, without a category last', () => {
    const groups = groupServices(
      [
        service('late', { category_id: 'x', sort_order: 2 }),
        service('early', { category_id: 'x', sort_order: 1 }),
        service('other', { category_id: 'y' }),
        service('loose'),
        service('gone', { category_id: 'removed' }),
      ],
      [cat('x', 2), cat('y', 1)],
      ['manicure'],
    );
    const categories = groups[0].categories;
    expect(categories.map((c) => c.category?.id ?? null)).toEqual(['y', 'x', null]);
    expect(categories[1].services.map((s) => s.id)).toEqual(['early', 'late']);
    expect(categories[2].services.map((s) => s.id)).toEqual(['gone', 'loose']);
  });
});

describe('directionOrder', () => {
  it('adds what services still use and skips what is unused', () => {
    expect(directionOrder(['pedicure'], [{ specialization: 'manicure' }, { specialization: null }])).toEqual([
      'pedicure',
      'manicure',
    ]);
  });
});
