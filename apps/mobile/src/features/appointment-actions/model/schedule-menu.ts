/**
 * The schedule's long-press menu (design "Запись в расписании · долгое нажатие"):
 * what a visit offers at each phase — a regular group and a red one.
 */
import {
  getAppointmentPhase,
  type Appointment,
  type AppointmentPhase,
} from '@/entities/appointment';
import type { Client } from '@/entities/client';
import type { IconName } from '@/shared/ui';

/** What an action on a visit needs to know about it. */
export interface ScheduleVisitInfo {
  appointment: Appointment;
  client: Client | undefined;
  /** Service names, in the appointment's order. */
  serviceNames: string[];
  price: number;
}

/** An appointment as a schedule draws it. */
export interface ScheduleVisit extends ScheduleVisitInfo {
  color: string;
}

export type ScheduleMenuAction =
  | 'confirm'
  | 'complete'
  | 'edit'
  | 'reschedule'
  | 'propose_time'
  | 'book_again'
  | 'ask_review'
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
  completed: { regular: ['ask_review', ...NONE.regular], danger: [] },
  cancelled: NONE,
  no_show: NONE,
  expired: NONE,
};

export const MENU_ICON: Record<string, IconName> = {
  confirm: 'check',
  complete: 'completeVisit',
  edit: 'pencil',
  reschedule: 'reschedule',
  propose_time: 'send',
  book_again: 'repeat',
  ask_review: 'starOutline',
  whatsapp: 'whatsapp',
  call: 'call',
  open_client: 'userCircle',
  invite: 'whatsapp',
  dismiss: 'check',
  snooze: 'clock',
  decline: 'close',
  cancel: 'cancelCircle',
  no_show: 'noShow',
};

/** The rows of a menu: its regular group, then the red one. */
export function menuRows(
  groups: { regular: readonly string[]; danger: readonly string[] },
  t: (key: string) => string,
) {
  const item = (danger: boolean) => (key: string) => ({
    key,
    label: t(`today.attention.menu.${key}`),
    icon: MENU_ICON[key],
    danger,
  });
  return [...groups.regular.map(item(false)), ...groups.danger.map(item(true))];
}

/** A schedule visit's long-press menu at its current phase. */
export function scheduleMenuRows(
  appointment: Appointment,
  now: number,
  t: (key: string) => string,
) {
  return menuRows(SCHEDULE_MENU[getAppointmentPhase(appointment, now)], t);
}
