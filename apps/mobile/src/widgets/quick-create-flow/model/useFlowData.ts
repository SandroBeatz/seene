/**
 * What every step of "Новая запись" reads: the master's zone and time labels (the
 * shared time context), currency, the price list, and the draft resolved against
 * them — the chosen client, services and the visit's length and list price.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useClientsQuery } from '@/entities/client';
import { useMasterSettingsQuery } from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useTimeContext } from '@/features/pick-time';
import { currencySymbol, formatAmount } from '@/shared/lib/formats';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { useQuickCreateDraft } from './draft.store';

export function useFlowData() {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const ctx = useTimeContext();
  const { userId } = ctx;
  const settings = useMasterSettingsQuery(userId);
  const services = useServicesQuery(userId);
  const clients = useClientsQuery(userId);
  const draft = useQuickCreateDraft();

  const currency = settings.data?.currency ?? 'EUR';

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

  return {
    t,
    locale,
    userId,
    zone: ctx.zone,
    currencyLabel: currencySymbol(currency, locale),
    money: (amount: number) => formatAmount(amount, { currency, locale }),
    services: services.data ?? [],
    isPending: ctx.isPending || services.isPending || clients.isPending,
    draft,
    client,
    picked,
    duration,
    listPrice,
    dayLabel: ctx.dayLabel,
    dayKeyOf: ctx.dayKeyOf,
    /** "11:00–13:00", the chosen services' length by default. */
    range: (startIso: string, minutes = duration) => ctx.range(startIso, minutes),
  };
}

export type FlowData = ReturnType<typeof useFlowData>;
