/**
 * Runs an appointment action on a visit from a schedule ("Сегодня", calendar), with the
 * message context its WhatsApp texts need ("сегодня, в 16:00", "Маникюр", "2 400 сом").
 */
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { formatAmount, formatTime } from '@/shared/lib/formats';
import type { AppLocale } from '@/shared/lib/i18n';
import type { ScheduleVisitInfo } from './schedule-menu';
import {
  useAppointmentActions,
  type AppointmentActionContext,
  type AppointmentActionKey,
} from './useAppointmentActions';

export interface VisitActionsInput {
  zone: string;
  todayKey: string;
  timeFormat: 12 | 24;
  currency: string;
  locale: AppLocale;
}

export function useVisitActions(input: VisitActionsInput) {
  const { t } = useTranslation();
  const actions = useAppointmentActions();

  const contextOf = (visit: ScheduleVisitInfo): AppointmentActionContext => {
    const local = DateTime.fromISO(visit.appointment.start_at, { zone: 'utc' })
      .setZone(input.zone)
      .setLocale(input.locale);
    const days = Math.round(
      local.startOf('day').diff(DateTime.fromISO(input.todayKey, { zone: input.zone }), 'days')
        .days,
    );
    const date =
      days === 0
        ? t('preview.day.today')
        : days === 1
          ? t('preview.day.tomorrow')
          : local.toFormat('d MMMM');
    return {
      appointment: visit.appointment,
      clientFirstName: visit.client?.first_name ?? '',
      phone: visit.client?.phone ?? '',
      when: t('preview.when', {
        date: date.toLocaleLowerCase(input.locale),
        time: formatTime(visit.appointment.start_at, {
          zone: input.zone,
          timeFormat: input.timeFormat,
        }),
      }),
      services: visit.serviceNames.join(', '),
      price: formatAmount(visit.price, { currency: input.currency, locale: input.locale }),
    };
  };

  const run = (visit: ScheduleVisitInfo | null, action: AppointmentActionKey) => {
    if (visit) actions.runFor(contextOf(visit), action);
  };

  return { ...actions, contextOf, run };
}
