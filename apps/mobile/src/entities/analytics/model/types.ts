/** What `get_money_overview` and `get_money_clients` return, and the sales list. */
import type { PeriodRange } from '../lib/period';

export interface PeriodMetrics {
  earned: number;
  tips: number;
  visits: number;
  avg_check: number | null;
  no_shows: number;
  new_clients: number;
  spent: number;
  /** Null when the master had no working hours in the period. */
  load_pct: number | null;
  free_minutes: number | null;
}

export interface TopClient {
  client_id: string;
  first_name: string;
  last_name: string | null;
  avatar_color: string | null;
  visits: number;
  amount: number;
}

export interface MoneyOverview {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  /** A bar per day or month; `day` is the bucket's first day ("yyyy-MM-dd"). */
  series: { day: string; amount: number }[];
  expenses: { category: string; amount: number }[];
  /** `kind`/`name` are null for a sale without a method. */
  payments: { kind: string | null; name: string | null; amount: number }[];
  top_services: { name: string; revenue: number; count: number; color: string | null }[];
  services_total: number;
  clients: { total: number; new: number; returning: number };
  top_clients: TopClient[];
  /** Finished visits, Monday first. */
  busy_days: number[];
  peak_hour: number | null;
  losses: { no_shows: number; client_cancels: number; lost: number };
}

export interface PeriodClient {
  client_id: string;
  first_name: string;
  last_name: string | null;
  avatar_color: string | null;
  visits: number;
  last_visit: string;
  amount: number;
  is_new: boolean;
}

/** A paid visit in "Операции". */
export interface SaleOperation {
  id: string;
  appointment_id: string;
  amount: number;
  tip: number;
  paid_at: string;
  client: { first_name: string; last_name: string | null; avatar_color: string | null } | null;
  payment_type: { kind: string; name: string } | null;
  items: { name_snapshot: string }[];
}

export type MoneyOverviewParams = PeriodRange & { zone: string };
