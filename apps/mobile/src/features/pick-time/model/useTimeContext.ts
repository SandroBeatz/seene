/**
 * What every time picker reads: the master's zone, working week, grid step and clock
 * format, and the labels built from them ("Пт 31 октября", "11:00–13:00").
 */
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useUserId } from '@/entities/session';
import { formatTime } from '@/shared/lib/formats';
import { deviceTimeZone } from '@/shared/lib/time-zone';

/** Grid step when the settings don't say. */
const DEFAULT_STEP_MINUTES = 30;

export function useTimeContext() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);

  const storedSchedule = profile.data?.schedule;
  const schedule = useMemo(() => parseStoredSchedule(storedSchedule), [storedSchedule]);
  const zone = schedule?.timezone ?? deviceTimeZone();
  const timeFormat: 12 | 24 = settings.data?.time_format === 12 ? 12 : 24;
  const stepMinutes = settings.data?.calendar_slot_step_minutes || DEFAULT_STEP_MINUTES;

  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const monthsGenitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const time = (iso: string) => formatTime(iso, { zone, timeFormat });

  return {
    userId,
    zone,
    schedule,
    stepMinutes,
    timeFormat,
    isPending: profile.isPending || settings.isPending,
    time,
    /** "Пт 31 октября". */
    dayLabel: (dayKey: string) => {
      const day = DateTime.fromISO(dayKey, { zone });
      return `${weekdays[day.weekday - 1]} ${day.day} ${monthsGenitive[day.month - 1] ?? ''}`;
    },
    /** "11:00–13:00". */
    range: (startIso: string, minutes: number) =>
      `${time(startIso)}–${time(new Date(new Date(startIso).getTime() + minutes * 60_000).toISOString())}`,
    dayKeyOf: (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).toISODate()!,
  };
}

export type TimeContext = ReturnType<typeof useTimeContext>;
