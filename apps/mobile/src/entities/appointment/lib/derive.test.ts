import { describe, expect, it } from '@jest/globals';
import {
  appointmentTotalPrice,
  getEffectiveAppointmentStatus,
  isActionable,
  lastVisitDate,
  sumServiceDuration,
  sumServicePrice,
} from './derive';
import type { AppointmentStatus } from '../model/types';

const NOON = Date.parse('2026-08-30T12:00:00.000Z');
const at = (iso: string, duration: number, status: AppointmentStatus) => ({
  start_at: iso,
  duration,
  status,
});

describe('getEffectiveAppointmentStatus', () => {
  it('returns ongoing for a confirmed appointment whose window contains now', () => {
    const a = at('2026-08-30T11:30:00.000Z', 60, 'confirmed'); // 11:30–12:30
    expect(getEffectiveAppointmentStatus(a, NOON)).toBe('ongoing');
  });

  it('returns past for a confirmed appointment that has ended', () => {
    const a = at('2026-08-30T10:00:00.000Z', 30, 'confirmed'); // ends 10:30
    expect(getEffectiveAppointmentStatus(a, NOON)).toBe('past');
  });

  it('leaves a not-yet-started confirmed appointment as confirmed', () => {
    const a = at('2026-08-30T14:00:00.000Z', 30, 'confirmed');
    expect(getEffectiveAppointmentStatus(a, NOON)).toBe('confirmed');
  });

  it('never overrides a completed or pending status', () => {
    expect(getEffectiveAppointmentStatus(at('2026-08-30T10:00:00.000Z', 30, 'completed'), NOON)).toBe(
      'completed',
    );
    expect(getEffectiveAppointmentStatus(at('2026-08-30T10:00:00.000Z', 30, 'pending'), NOON)).toBe(
      'pending',
    );
  });
});

describe('isActionable', () => {
  it('flags any pending appointment', () => {
    expect(isActionable(at('2026-08-30T18:00:00.000Z', 30, 'pending'), NOON)).toBe(true);
  });

  it('flags a confirmed appointment that has already started', () => {
    expect(isActionable(at('2026-08-30T11:00:00.000Z', 30, 'confirmed'), NOON)).toBe(true);
  });

  it('does not flag a future confirmed appointment', () => {
    expect(isActionable(at('2026-08-30T13:00:00.000Z', 30, 'confirmed'), NOON)).toBe(false);
  });
});

describe('lastVisitDate', () => {
  it('returns the most recent ended completed/confirmed visit', () => {
    const list = [
      at('2026-08-20T10:00:00.000Z', 30, 'completed'),
      at('2026-08-28T10:00:00.000Z', 30, 'confirmed'), // most recent ended
      at('2026-08-31T10:00:00.000Z', 30, 'confirmed'), // future — ignored
      at('2026-08-25T10:00:00.000Z', 30, 'cancelled'), // not a visit
    ];
    expect(lastVisitDate(list, NOON)).toBe('2026-08-28T10:00:00.000Z');
  });

  it('returns null when there are no past visits', () => {
    expect(lastVisitDate([at('2026-08-31T10:00:00.000Z', 30, 'confirmed')], NOON)).toBeNull();
  });
});

describe('service totals', () => {
  it('sums durations and prices', () => {
    const services = [
      { duration: 30, price: 20 },
      { duration: 45, price: 35 },
    ];
    expect(sumServiceDuration(services)).toBe(75);
    expect(sumServicePrice(services)).toBe(55);
  });

  it('prefers an explicit appointment price over the service sum', () => {
    const services = [{ price: 55 }];
    expect(appointmentTotalPrice({ price: 40 }, services)).toBe(40);
    expect(appointmentTotalPrice({ price: null }, services)).toBe(55);
  });
});
