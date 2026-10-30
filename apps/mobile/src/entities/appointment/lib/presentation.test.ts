import { describe, expect, it } from '@jest/globals';
import type { AppointmentSource, AppointmentStatus } from '../model/types';
import {
  appointmentColor,
  getAppointmentPhase,
  isShownInSchedule,
  minutesUntilStart,
  PREVIEW_ACTIONS,
  scheduleCardLook,
  visitProgress,
} from './presentation';

const START = '2026-10-27T10:00:00.000Z';
const at = (iso: string) => new Date(iso).getTime();
const BEFORE = at('2026-10-27T09:00:00.000Z');
const DURING = at('2026-10-27T10:30:00.000Z');
const AFTER = at('2026-10-27T12:00:00.000Z');

function appt(status: AppointmentStatus, source: AppointmentSource = 'manual') {
  return { status, source, start_at: START, duration: 90 };
}

describe('getAppointmentPhase', () => {
  it('splits pending by source before the start', () => {
    expect(getAppointmentPhase(appt('pending', 'online_booking'), BEFORE)).toBe('request');
    expect(getAppointmentPhase(appt('pending', 'manual'), BEFORE)).toBe('unconfirmed');
  });

  it('marks pending overdue from the start time, whatever the source', () => {
    expect(getAppointmentPhase(appt('pending', 'online_booking'), at(START))).toBe('overdue');
    expect(getAppointmentPhase(appt('pending', 'manual'), AFTER)).toBe('overdue');
  });

  it('walks confirmed through upcoming → ongoing → awaiting', () => {
    expect(getAppointmentPhase(appt('confirmed'), BEFORE)).toBe('upcoming');
    expect(getAppointmentPhase(appt('confirmed'), at(START))).toBe('ongoing');
    expect(getAppointmentPhase(appt('confirmed'), DURING)).toBe('ongoing');
    expect(getAppointmentPhase(appt('confirmed'), at('2026-10-27T11:30:00.000Z'))).toBe('awaiting');
  });

  it.each(['completed', 'cancelled', 'no_show', 'expired'] as const)(
    'keeps the final status %s at any time',
    (status) => {
      expect(getAppointmentPhase(appt(status), BEFORE)).toBe(status);
      expect(getAppointmentPhase(appt(status), AFTER)).toBe(status);
    },
  );
});

describe('isShownInSchedule', () => {
  it('shows pending, confirmed and completed only', () => {
    const shown = (
      ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'expired'] as const
    ).filter((status) => isShownInSchedule({ status }));
    expect(shown).toEqual(['pending', 'confirmed', 'completed']);
  });
});

describe('scheduleCardLook', () => {
  it('dims once the visit has ended', () => {
    expect(scheduleCardLook(appt('confirmed'), DURING).dimmed).toBe(false);
    expect(scheduleCardLook(appt('confirmed'), at('2026-10-27T11:30:00.000Z')).dimmed).toBe(true);
  });

  it('flags pending as unconfirmed', () => {
    expect(scheduleCardLook(appt('pending'), BEFORE).unconfirmed).toBe(true);
    expect(scheduleCardLook(appt('confirmed'), BEFORE).unconfirmed).toBe(false);
  });
});

describe('PREVIEW_ACTIONS', () => {
  it('matches the designed bottom bars', () => {
    expect(PREVIEW_ACTIONS.upcoming).toEqual({
      start: 'reschedule',
      primary: 'complete',
      end: 'cancel',
      timer: false,
    });
    expect(PREVIEW_ACTIONS.ongoing).toEqual({
      start: null,
      primary: 'complete',
      end: null,
      timer: true,
    });
    expect(PREVIEW_ACTIONS.awaiting).toEqual({
      start: 'no_show',
      primary: 'complete',
      end: 'reschedule',
      timer: false,
    });
    expect(PREVIEW_ACTIONS.completed).toEqual({
      start: 'book_again',
      primary: null,
      end: 'edit',
      timer: false,
    });
  });
});

describe('visitProgress', () => {
  it('counts whole minutes against the plan', () => {
    const p = visitProgress({ start_at: START, duration: 120 }, at('2026-10-27T10:47:30.000Z'));
    expect(p).toEqual({
      elapsedMinutes: 47,
      plannedMinutes: 120,
      ratio: 47 / 120,
      overtime: false,
    });
  });

  it('caps the ratio and flags overtime', () => {
    const p = visitProgress({ start_at: START, duration: 60 }, AFTER);
    expect(p.ratio).toBe(1);
    expect(p.overtime).toBe(true);
  });

  it('never goes negative before the start', () => {
    expect(visitProgress({ start_at: START, duration: 60 }, BEFORE).elapsedMinutes).toBe(0);
  });
});

describe('minutesUntilStart', () => {
  it('rounds up to whole minutes', () => {
    expect(minutesUntilStart({ start_at: START }, at('2026-10-27T07:59:30.000Z'))).toBe(121);
    expect(minutesUntilStart({ start_at: START }, DURING)).toBe(-30);
  });
});

describe('appointmentColor', () => {
  const services = new Map([
    ['nails', { color: '#E9A5B5' }],
    ['brows', { color: '#D8B88B' }],
  ]);

  it('takes the first service colour', () => {
    expect(appointmentColor(['brows', 'nails'], services, '#000000')).toBe('#D8B88B');
  });

  it('skips deleted services and falls back when none are left', () => {
    expect(appointmentColor(['gone', 'nails'], services, '#000000')).toBe('#E9A5B5');
    expect(appointmentColor(['gone'], services, '#000000')).toBe('#000000');
    expect(appointmentColor([], services, '#000000')).toBe('#000000');
  });
});
