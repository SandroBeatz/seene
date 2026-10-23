/**
 * Analytics types. Thin in Phase 2 — the RPCs return `Json` and are consumed only in
 * Phase 5, which will refine these result shapes. The RPCs filter by `auth.uid()`
 * internally, so no userId is passed; it is kept in cache keys for isolation only.
 */
import type { Json } from '@/shared/api/database.types';

export interface AnalyticsParams {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  granularity?: string;
  tz?: string;
}

export interface AnalyticsWidgetsParams {
  topFrom: string;
  topTo: string;
  mixFrom: string;
  mixTo: string;
  daysFrom: string;
  daysTo: string;
  tz?: string;
}

export type AnalyticsResult = Json;
export type AnalyticsWidgetsResult = Json;
