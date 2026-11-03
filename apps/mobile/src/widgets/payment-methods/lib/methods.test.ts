import { describe, expect, it } from '@jest/globals';
import { customMethods, isLastActive, nextMethodOrder, systemMethods } from './methods';

const m = (id: string, kind: 'cash' | 'card' | 'transfer' | 'qr' | 'custom', is_active = true, sort_order = 0) => ({
  id,
  kind,
  is_active,
  sort_order,
});

describe('the list', () => {
  const all = [m('own', 'custom'), m('c', 'card'), m('q', 'qr'), m('a', 'cash'), m('t', 'transfer')];

  it('puts system methods in the design’s order', () => {
    expect(systemMethods(all).map((x) => x.id)).toEqual(['a', 't', 'c', 'q']);
  });
  it('keeps the master’s own apart', () => {
    expect(customMethods(all).map((x) => x.id)).toEqual(['own']);
  });
});

describe('isLastActive', () => {
  it('holds the only method that is on', () => {
    const only = m('a', 'cash');
    expect(isLastActive(only, [only, m('c', 'card', false)])).toBe(true);
  });
  it('counts the master’s own methods', () => {
    const cash = m('a', 'cash');
    expect(isLastActive(cash, [cash, m('own', 'custom')])).toBe(false);
  });
  it('lets a method that is off be switched on', () => {
    const off = m('a', 'cash', false);
    expect(isLastActive(off, [off, m('c', 'card', false)])).toBe(false);
  });
});

describe('nextMethodOrder', () => {
  it('goes after the last', () => {
    expect(nextMethodOrder([m('a', 'cash', true, 0), m('o', 'custom', true, 6)])).toBe(7);
    expect(nextMethodOrder([])).toBe(0);
  });
});
