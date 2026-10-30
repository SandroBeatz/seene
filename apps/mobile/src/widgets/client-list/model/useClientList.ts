/**
 * The "Клиенты" tab's data: the address book with each client's numbers
 * (`client_summaries()`), who is due for a call (their visit rhythm, minus the ones
 * already invited) and the counts behind the filter chips.
 */
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { useVisitHistoryQuery } from '@/entities/appointment';
import { useDismissedAttentionQuery } from '@/entities/attention';
import {
  CLIENT_SEGMENTS,
  clientName,
  inSegment,
  recallCandidates,
  useClientsQuery,
  useClientSummariesQuery,
  type Client,
  type ClientSegment,
  type ClientSummary,
} from '@/entities/client';
import { parseStoredSchedule, useMasterProfileQuery, useMasterSettingsQuery } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { useNow } from '@/shared/ui';

/** History behind a client's rhythm — the same window as "Сегодня". */
const HISTORY_DAYS = 730;

export interface ClientRow {
  client: Client;
  name: string;
  summary: ClientSummary | undefined;
  /** Set when the client is due for a call. */
  recall: { cadenceDays: number; sinceDays: number } | null;
}

export function useClientList() {
  const userId = useUserId() ?? '';
  const now = useNow();

  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const zone = parseStoredSchedule(profile.data?.schedule)?.timezone ?? deviceTimeZone();
  // Per calendar day, so the history query key stays put between renders.
  const historyFrom = DateTime.fromMillis(now, { zone })
    .startOf('day')
    .minus({ days: HISTORY_DAYS })
    .toUTC()
    .toISO()!;

  const clients = useClientsQuery(userId);
  const summaries = useClientSummariesQuery(userId);
  const history = useVisitHistoryQuery(userId, historyFrom);
  const dismissed = useDismissedAttentionQuery(userId);

  const queries = [clients, summaries, history, dismissed, profile];
  const isPending = clients.isPending || summaries.isPending;
  const error = queries.find((q) => q.isError)?.error ?? null;
  const isRefetching = queries.some((q) => q.isRefetching);
  const refetch = () => Promise.all(queries.map((q) => q.refetch()));

  const derived = useMemo(() => {
    const due = new Map(
      recallCandidates(history.data ?? [], now)
        .filter((c) => !dismissed.data?.has(`recall:${c.clientId}`))
        .map((c) => [c.clientId, { cadenceDays: c.cadenceDays, sinceDays: c.sinceDays }]),
    );
    const rows: ClientRow[] = (clients.data ?? [])
      .map((client) => ({
        client,
        name: clientName(client),
        summary: summaries.data?.get(client.id),
        recall: due.get(client.id) ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const counts = Object.fromEntries(
      CLIENT_SEGMENTS.map((segment) => [
        segment,
        rows.filter((row) => inSegment(segment, { ...row, recall: !!row.recall })).length,
      ]),
    ) as Record<ClientSegment, number>;
    return { rows, counts };
  }, [clients.data, summaries.data, history.data, dismissed.data, now]);

  return {
    ...derived,
    isPending,
    error,
    isRefetching,
    refetch,
    now,
    zone,
    timeFormat: (settings.data?.time_format === 12 ? 12 : 24) as 12 | 24,
  };
}
