/**
 * Preview copy that depends on time: the status pill ("Подтверждена · через 2 ч",
 * "Идёт сейчас · с 14:00"), the relative day of the date row, and which actions the
 * "⋯" menu offers per phase (design "Запись · меню «⋯»"). Pure, `now`-injected.
 */
import { minutesUntilStart, type Appointment, type AppointmentPhase } from '@/entities/appointment';

export interface Label {
  key: string;
  params?: Record<string, string | number>;
}

/** The pill text: an i18n key under `preview.status` and its params. */
export function statusLabel(
  phase: AppointmentPhase,
  appointment: Pick<Appointment, 'start_at'>,
  now: number,
  formatTime: (iso: string) => string,
): Label {
  if (phase === 'upcoming') {
    const minutes = minutesUntilStart(appointment, now);
    if (minutes < 60) return { key: 'preview.status.upcomingMinutes', params: { count: minutes } };
    if (minutes < 12 * 60) {
      return { key: 'preview.status.upcomingHours', params: { count: Math.round(minutes / 60) } };
    }
    return { key: 'preview.status.upcoming' };
  }
  if (phase === 'ongoing') {
    return { key: 'preview.status.ongoing', params: { time: formatTime(appointment.start_at) } };
  }
  return { key: `preview.status.${phase}` };
}

export type RelativeDay = 'today' | 'tomorrow' | 'yesterday' | null;

/** "Сегодня" / "Завтра" / "Вчера" for day keys ('yyyy-MM-dd') one day apart, else null. */
export function relativeDay(dayKey: string, todayKey: string): RelativeDay {
  const days = Math.round(
    (Date.parse(`${dayKey}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / 86_400_000,
  );
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return null;
}

export type MenuAction = 'book_again' | 'note' | 'send_details' | 'no_show' | 'cancel' | 'delete';

/** The "⋯" menu: a regular group and a red group under it. */
export interface MoreMenu {
  regular: MenuAction[];
  danger: MenuAction[];
}

const visit = (danger: MenuAction[]): MoreMenu => ({
  regular: ['book_again', 'note', 'send_details'],
  danger,
});

export const MORE_MENU: Record<AppointmentPhase, MoreMenu> = {
  request: { regular: ['note', 'send_details'], danger: ['delete'] },
  unconfirmed: { regular: ['note', 'send_details'], danger: ['delete'] },
  overdue: { regular: ['note'], danger: ['delete'] },
  upcoming: visit(['no_show', 'delete']),
  ongoing: visit(['no_show', 'delete']),
  awaiting: visit(['cancel', 'delete']),
  completed: visit(['delete']),
  cancelled: { regular: ['book_again', 'note'], danger: ['delete'] },
  no_show: { regular: ['book_again', 'note'], danger: ['delete'] },
  expired: { regular: ['book_again', 'note'], danger: ['delete'] },
};
