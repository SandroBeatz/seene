import { describe, expect, it } from '@jest/globals';
import { personalTimeRecord } from './record';

const ZONE = 'Asia/Bishkek'; // UTC+6
const base = { start: null, allDay: false, length: 60, title: '' };

describe('personalTimeRecord', () => {
  it('is null until a start is chosen', () => {
    expect(personalTimeRecord(base, '2026-11-02', ZONE)).toBeNull();
  });

  it('spans the start plus the length, with the trimmed name', () => {
    expect(
      personalTimeRecord(
        { ...base, start: '2026-11-02T07:00:00.000Z', length: 90, title: '  Обед ' },
        '2026-11-02',
        ZONE,
      ),
    ).toEqual({
      start_at: '2026-11-02T07:00:00.000Z',
      end_at: '2026-11-02T08:30:00.000Z',
      all_day: false,
      notes: 'Обед',
    });
  });

  it('covers the local day when it is the whole day, without a name', () => {
    expect(
      personalTimeRecord(
        { ...base, allDay: true, start: '2026-11-02T07:00:00.000Z', title: ' ' },
        '2026-11-02',
        ZONE,
      ),
    ).toEqual({
      start_at: '2026-11-01T18:00:00.000Z',
      end_at: '2026-11-02T18:00:00.000Z',
      all_day: true,
      notes: null,
    });
  });
});
