import { describe, expect, it } from '@jest/globals';
import { DateTime } from 'luxon';
import { timeZoneEntry, zoneOffsetLabel } from './time-zones';

describe('time zones', () => {
  const winter = DateTime.fromISO('2026-01-15T12:00:00Z');
  const summer = DateTime.fromISO('2026-07-15T12:00:00Z');

  it('labels offsets like the design, DST-aware', () => {
    expect(zoneOffsetLabel('Asia/Bishkek', winter)).toBe('GMT+6');
    expect(zoneOffsetLabel('America/St_Johns', winter)).toBe('GMT−3:30');
    expect(zoneOffsetLabel('America/Toronto', winter)).toBe('GMT−5');
    expect(zoneOffsetLabel('America/Toronto', summer)).toBe('GMT−4');
    expect(zoneOffsetLabel('Europe/London', winter)).toBe('GMT');
  });

  it('names unknown zones after their city', () => {
    expect(timeZoneEntry('America/Sao_Paulo').name.ru).toBe('Sao Paulo');
    expect(timeZoneEntry('Asia/Bishkek').place.ru).toBe('Кыргызстан');
  });
});
