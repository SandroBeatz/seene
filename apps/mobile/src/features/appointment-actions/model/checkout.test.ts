import { describe, expect, it } from '@jest/globals';
import {
  clockOf,
  defaultMethodId,
  defaultVisitWindow,
  saleItems,
  visitChanges,
  windowFromClocks,
} from './checkout';

const zone = 'Asia/Bishkek'; // UTC+6
const visit = { start_at: '2026-10-30T08:00:00.000Z', duration: 120 }; // 14:00–16:00
const at = (iso: string) => Date.parse(iso);

describe('defaultVisitWindow', () => {
  it('keeps the plan before the start and long after the end', () => {
    expect(defaultVisitWindow(visit, at('2026-10-30T07:00:00Z'))).toEqual(visit);
    expect(defaultVisitWindow(visit, at('2026-10-30T11:30:00Z'))).toEqual(visit);
  });

  it('ends now when closed out at the chair, rounded to 5 min', () => {
    expect(defaultVisitWindow(visit, at('2026-10-30T09:31:00Z')).duration).toBe(90);
    expect(defaultVisitWindow(visit, at('2026-10-30T10:22:00Z')).duration).toBe(140);
  });

  it('never goes below the minimum length', () => {
    expect(defaultVisitWindow(visit, at('2026-10-30T08:01:00Z')).duration).toBe(5);
  });
});

describe('clocks', () => {
  it('reads the wall clock in the zone', () => {
    expect(clockOf(visit.start_at, zone)).toBe('14:00');
  });

  it('builds a window on the visit day', () => {
    expect(windowFromClocks(visit.start_at, zone, '13:45', '16:15')).toEqual({
      start_at: '2026-10-30T07:45:00.000Z',
      duration: 150,
    });
  });

  it('runs past midnight when the end is earlier', () => {
    expect(windowFromClocks(visit.start_at, zone, '23:00', '01:00')?.duration).toBe(120);
  });

  it('rejects a too short visit', () => {
    expect(windowFromClocks(visit.start_at, zone, '14:00', '14:02')).toBeNull();
  });
});

describe('visitChanges', () => {
  it('sends only what differs', () => {
    expect(visitChanges(visit, { ...visit })).toEqual({ start_at: null, duration: null });
    expect(visitChanges(visit, { start_at: '2026-10-30T08:00:00Z', duration: 90 })).toEqual({
      start_at: null,
      duration: 90,
    });
  });
});

describe('defaultMethodId', () => {
  const m = (id: string, is_default = false, is_active = true) => ({ id, is_default, is_active });
  it('prefers the active default, else the first active', () => {
    expect(defaultMethodId([m('cash'), m('card', true)])).toBe('card');
    expect(defaultMethodId([m('cash', true, false), m('card')])).toBe('card');
    expect(defaultMethodId([])).toBeNull();
  });
});

describe('saleItems', () => {
  it('snapshots the services in order and skips deleted ones', () => {
    const services = [
      { id: 'a', name: 'A', price: 100 },
      { id: 'b', name: 'B', price: 200 },
    ];
    expect(saleItems(['b', 'x', 'a'], services)).toEqual([
      { service_id: 'b', name: 'B', price: 200 },
      { service_id: 'a', name: 'A', price: 100 },
    ]);
  });
});
