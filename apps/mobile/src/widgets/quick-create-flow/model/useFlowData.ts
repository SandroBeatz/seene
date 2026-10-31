/**
 * What every step of "Новая запись" reads: the master's zone, working week, grid
 * step and formats, the price list, the address book, and the draft resolved against
 * them — the chosen client, services and the visit's length and list price.
 */
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { clientName, useClientsQuery, useClientSummariesQuery } from '@/entities/client';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { currencySymbol, formatAmount, formatTime } from '@/shared/lib/formats';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { useQuickCreateDraft } from './draft.store';

/** Grid step when the settings don't say. */
const DEFAULT_STEP_MINUTES = 30;

export function useFlowData() {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const services = useServicesQuery(userId);
  const clients = useClientsQuery(userId);
  const summaries = useClientSummariesQuery(userId);
  const draft = useQuickCreateDraft();

  const schedule = parseStoredSchedule(profile.data?.schedule);
  const zone = schedule?.timezone ?? deviceTimeZone();
  const currency = settings.data?.currency ?? 'EUR';
  const timeFormat: 12 | 24 = settings.data?.time_format === 12 ? 12 : 24;
  const stepMinutes = settings.data?.calendar_slot_step_minutes || DEFAULT_STEP_MINUTES;

  const client = useMemo(
    () => clients.data?.find((c) => c.id === draft.clientId) ?? null,
    [clients.data, draft.clientId],
  );
  const picked = useMemo(() => {
    const byId = new Map((services.data ?? []).map((s) => [s.id, s]));
    return draft.serviceIds.flatMap((id) => byId.get(id) ?? []);
  }, [services.data, draft.serviceIds]);
  const duration = picked.reduce((sum, s) => sum + s.duration, 0);
  const listPrice = picked.reduce((sum, s) => sum + s.price, 0);

  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const monthsGenitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const time = (iso: string) => formatTime(iso, { zone, timeFormat });
  /** "Пт 31 октября". */
  const dayLabel = (dayKey: string) => {
    const day = DateTime.fromISO(dayKey, { zone });
    return `${weekdays[day.weekday - 1]} ${day.day} ${monthsGenitive[day.month - 1] ?? ''}`;
  };
  /** "11:00–13:00". */
  const range = (startIso: string, minutes = duration) =>
    `${time(startIso)}–${time(new Date(new Date(startIso).getTime() + minutes * 60_000).toISOString())}`;

  return {
    t,
    locale,
    userId,
    zone,
    schedule,
    stepMinutes,
    timeFormat,
    currency,
    currencyLabel: currencySymbol(currency, locale),
    money: (amount: number) => formatAmount(amount, { currency, locale }),
    services: services.data ?? [],
    clients: clients.data ?? [],
    summaries: summaries.data,
    isPending: profile.isPending || settings.isPending || services.isPending || clients.isPending,
    draft,
    client,
    clientLabel: client ? clientName(client) : '',
    picked,
    duration,
    listPrice,
    time,
    dayLabel,
    range,
    dayKeyOf: (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).toISODate()!,
  };
}

export type FlowData = ReturnType<typeof useFlowData>;
