/**
 * "Пора позвать": a regular client who is overdue against their own rhythm
 * ("Обычно раз в 3 недели" · "7 недель"). Pure, `now`-injected.
 */

const DAY_MS = 86_400_000;
/** Visits needed to know a rhythm (two gaps). */
const MIN_VISITS = 3;
/** Late by half the rhythm, and by at least a week, before we suggest a call. */
const LATE_SHARE = 0.5;
const MIN_LATE_DAYS = 7;

export interface RecallState {
  /** Median days between visits. */
  cadenceDays: number;
  /** Days since the last visit. */
  sinceDays: number;
  due: boolean;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * The client's rhythm from their past visit starts (UTC ISO, any order), or `null`
 * with too few visits. A client with a booking ahead is never due.
 */
export function recallState(
  visitStarts: readonly string[],
  hasUpcoming: boolean,
  now: number = Date.now(),
): RecallState | null {
  const times = visitStarts
    .map((iso) => new Date(iso).getTime())
    .filter((t) => t <= now)
    .sort((a, b) => a - b);
  if (times.length < MIN_VISITS) return null;

  const gaps = times.slice(1).map((t, i) => (t - times[i]) / DAY_MS);
  const cadenceDays = Math.round(median(gaps));
  const sinceDays = Math.floor((now - times[times.length - 1]) / DAY_MS);
  const lateBy = Math.max(cadenceDays * LATE_SHARE, MIN_LATE_DAYS);

  return { cadenceDays, sinceDays, due: !hasUpcoming && sinceDays >= cadenceDays + lateBy };
}
