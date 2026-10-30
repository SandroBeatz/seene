/**
 * The schedule's long-press menu (design "Запись в расписании · долгое нажатие"):
 * what a visit offers at each phase — a regular group and a red one.
 */
import type { AppointmentPhase } from '@/entities/appointment';

export type ScheduleMenuAction =
  | 'confirm'
  | 'complete'
  | 'edit'
  | 'reschedule'
  | 'propose_time'
  | 'book_again'
  | 'whatsapp'
  | 'call'
  | 'open_client'
  | 'decline'
  | 'cancel'
  | 'no_show';

export interface ScheduleMenu {
  regular: ScheduleMenuAction[];
  danger: ScheduleMenuAction[];
}

const CONTACT: ScheduleMenuAction[] = ['whatsapp', 'call', 'open_client'];

const NONE: ScheduleMenu = { regular: ['book_again', ...CONTACT], danger: [] };

export const SCHEDULE_MENU: Record<AppointmentPhase, ScheduleMenu> = {
  request: { regular: ['confirm', 'edit', 'reschedule', ...CONTACT], danger: ['decline'] },
  unconfirmed: { regular: ['confirm', 'edit', 'reschedule', ...CONTACT], danger: ['cancel'] },
  overdue: { regular: ['propose_time', ...CONTACT], danger: ['decline'] },
  upcoming: { regular: ['edit', 'reschedule', ...CONTACT], danger: ['cancel'] },
  ongoing: {
    regular: ['complete', 'edit', 'reschedule', ...CONTACT],
    danger: ['no_show', 'cancel'],
  },
  awaiting: {
    regular: ['complete', 'edit', 'reschedule', ...CONTACT],
    danger: ['no_show', 'cancel'],
  },
  completed: NONE,
  cancelled: NONE,
  no_show: NONE,
  expired: NONE,
};
