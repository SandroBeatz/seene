/**
 * "Требуют внимания" data: visits around today (any status), the visit history that
 * gives each client's rhythm, and the cards the master closed — composed into the
 * ordered cards with their client and services resolved.
 */
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import {
  appointmentTotalPrice,
  useAppointmentsRangeQuery,
  useVisitHistoryQuery,
  type Appointment,
} from '@/entities/appointment';
import { useDismissedAttentionQuery } from '@/entities/attention';
import { recallCandidates, type Client } from '@/entities/client';
import type { ServiceWithCategory } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { dayBounds } from '@/shared/lib/scheduling';
import { buildAttentionItems, type AttentionItem } from './attention';

/** Overdue requests and visits to close out reach back this far. */
const LOOK_BACK_DAYS = 30;
/** Requests and client cancellations ahead. */
const LOOK_AHEAD_DAYS = 60;
/** History behind a client's rhythm. */
const HISTORY_DAYS = 730;

export interface AttentionVisit {
  appointment: Appointment;
  client: Client | undefined;
  serviceNames: string[];
  price: number;
}

export type AttentionCard = AttentionItem<Appointment> & {
  /** Resolved visit for appointment cards; for reminders, the next one to send. */
  visit: AttentionVisit | null;
  /** The recall card's client. */
  client: Client | undefined;
};

export interface AttentionLookups {
  zone: string;
  dayKey: string;
  now: number;
  clientById: ReadonlyMap<string, Client>;
  serviceById: ReadonlyMap<string, ServiceWithCategory>;
}

export function useAttention({ zone, dayKey, now, clientById, serviceById }: AttentionLookups) {
  const userId = useUserId() ?? '';
  const day = DateTime.fromISO(dayKey, { zone });
  const from = dayBounds(day.minus({ days: LOOK_BACK_DAYS }).toISODate()!, zone).start;
  const to = dayBounds(day.plus({ days: LOOK_AHEAD_DAYS }).toISODate()!, zone).end;
  const historyFrom = dayBounds(day.minus({ days: HISTORY_DAYS }).toISODate()!, zone).start;
  const tomorrowKey = day.plus({ days: 1 }).toISODate()!;

  const around = useAppointmentsRangeQuery(userId, from, to);
  const history = useVisitHistoryQuery(userId, historyFrom);
  const dismissed = useDismissedAttentionQuery(userId);

  const cards = useMemo<AttentionCard[] | null>(() => {
    if (!around.data || !history.data || !dismissed.data) return null;
    const resolve = (appointment: Appointment): AttentionVisit => {
      const its = appointment.service_ids.flatMap((id) => serviceById.get(id) ?? []);
      return {
        appointment,
        client: clientById.get(appointment.client_id),
        serviceNames: its.map((s) => s.name),
        price: appointmentTotalPrice(appointment, its),
      };
    };
    const items = buildAttentionItems({
      appointments: around.data,
      tomorrow: { ...dayBounds(tomorrowKey, zone), dayKey: tomorrowKey },
      // A deleted client has no card to show.
      recalls: recallCandidates(history.data, now).filter((r) => clientById.has(r.clientId)),
      dismissed: dismissed.data,
      now,
    });
    return items.map((item) => ({
      ...item,
      visit:
        'appointment' in item
          ? resolve(item.appointment)
          : item.kind === 'tomorrow_reminders'
            ? resolve(item.appointments[0])
            : null,
      client: item.kind === 'recall' ? clientById.get(item.clientId) : undefined,
    }));
  }, [around.data, history.data, dismissed.data, clientById, serviceById, tomorrowKey, zone, now]);

  return {
    cards,
    /** End of tomorrow — how long a sent reminder keeps its visit off the card. */
    tomorrowEnd: dayBounds(tomorrowKey, zone).end,
    refetch: () => Promise.all([around.refetch(), history.refetch(), dismissed.refetch()]),
  };
}
