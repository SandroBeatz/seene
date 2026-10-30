import { describe, expect, it } from '@jest/globals';
import {
  categoriesOf,
  directions,
  groupServices,
  parseAmount,
  resolveVisit,
  totalsOf,
  type PickableService,
} from './services';

let order = 0;
const svc = (
  id: string,
  specialization: string | null,
  category: string | null,
  price = 1000,
  extra: Partial<PickableService> = {},
): PickableService => ({
  id,
  name: id,
  duration: 60,
  price,
  is_active: true,
  sort_order: order++,
  specialization,
  category: category ? { id: category, name: category } : null,
  ...extra,
});

const services = [
  svc('gel', 'manicure', 'Маникюр', 1800),
  svc('art', 'manicure', 'Маникюр', 2400),
  svc('ext', 'manicure', 'Наращивание', 3200),
  svc('ped', 'pedicure', 'Педикюр', 2200),
  svc('brow', 'brows', null, 700),
  svc('old', 'brows', null, 500, { is_active: false }),
  svc('misc', null, null, 300),
];
const none = new Set<string>();
const all = { direction: 'all', category: 'all', query: '' };

describe('directions / categories', () => {
  it('keep price-list order; no section falls under "other"', () => {
    expect(directions(services)).toEqual(['manicure', 'pedicure', 'brows', 'other']);
    expect(categoriesOf(services, 'manicure').map((c) => c.name)).toEqual([
      'Маникюр',
      'Наращивание',
    ]);
    expect(categoriesOf(services, 'brows')).toEqual([{ id: null, name: null }]);
  });
});

describe('groupServices', () => {
  it('shows "Все" with direction headers and category captions', () => {
    const groups = groupServices(services, none, all);
    expect(
      groups.map((g) => [g.direction, g.category, g.directionHeader, g.categoryCaption]),
    ).toEqual([
      ['manicure', 'Маникюр', true, true],
      ['manicure', 'Наращивание', false, true],
      ['pedicure', 'Педикюр', true, false],
      ['brows', null, true, false],
      ['other', null, true, false],
    ]);
  });

  it('captions an uncategorised group next to named categories', () => {
    const mixed = [svc('a', 'pet_grooming', 'Мелкие породы'), svc('b', 'pet_grooming', null)];
    expect(groupServices(mixed, none, all).map((g) => [g.category, g.categoryCaption])).toEqual([
      ['Мелкие породы', true],
      [null, true],
    ]);
  });

  it('hides inactive services unless already on the appointment', () => {
    const ids = (sel: Set<string>) =>
      groupServices(services, sel, { ...all, direction: 'brows' }).flatMap((g) =>
        g.items.map((s) => s.id),
      );
    expect(ids(none)).toEqual(['brow']);
    expect(ids(new Set(['old']))).toEqual(['brow', 'old']);
  });

  it('filters by a direction and its category', () => {
    const groups = groupServices(services, none, {
      direction: 'manicure',
      category: 'Наращивание',
      query: '',
    });
    expect(groups.map((g) => g.items.map((s) => s.id))).toEqual([['ext']]);
    expect(groups[0].directionHeader).toBe(false);
  });

  it('searches by name across directions without headers', () => {
    const groups = groupServices(services, none, { ...all, query: 'E' });
    expect(groups.flatMap((g) => g.items.map((s) => s.id))).toEqual(['gel', 'ext', 'ped']);
    expect(groups.every((g) => !g.directionHeader && !g.categoryCaption)).toBe(true);
  });
});

describe('totals and overrides', () => {
  const totals = totalsOf(services, new Set(['art', 'brow']));

  it('sums the selected services', () => {
    expect(totals).toEqual({ listDuration: 120, listPrice: 3100 });
  });

  it('keeps the price list when nothing was typed', () => {
    expect(resolveVisit(totals, null, null)).toEqual({ duration: 120, price: null });
  });

  it('stores a typed price, and null when it equals the list', () => {
    expect(resolveVisit(totals, '90', '2 500')).toEqual({ duration: 90, price: 2500 });
    expect(resolveVisit(totals, null, '3 100')).toEqual({ duration: 120, price: null });
  });

  it('parses typed amounts', () => {
    expect(parseAmount('2 500 сом')).toBe(2500);
    expect(parseAmount('')).toBeNull();
  });
});
