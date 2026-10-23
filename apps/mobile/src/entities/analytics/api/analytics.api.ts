/**
 * Analytics api — the only supabase import site for this entity. Wraps the two
 * period/widget RPCs, which are SECURITY DEFINER and filter by `auth.uid()` internally.
 */
import { supabase } from '@/shared/api/supabase';
import type {
  AnalyticsParams,
  AnalyticsResult,
  AnalyticsWidgetsParams,
  AnalyticsWidgetsResult,
} from '../model/types';

export async function getAnalytics(params: AnalyticsParams): Promise<AnalyticsResult> {
  const { data, error } = await supabase.rpc('get_analytics_v2', {
    p_from: params.from,
    p_to: params.to,
    p_prev_from: params.prevFrom,
    p_prev_to: params.prevTo,
    p_granularity: params.granularity,
    p_tz: params.tz,
  });
  if (error) throw error;
  return data;
}

export async function getAnalyticsWidgets(
  params: AnalyticsWidgetsParams,
): Promise<AnalyticsWidgetsResult> {
  const { data, error } = await supabase.rpc('get_analytics_widgets_v2', {
    p_top_from: params.topFrom,
    p_top_to: params.topTo,
    p_mix_from: params.mixFrom,
    p_mix_to: params.mixTo,
    p_days_from: params.daysFrom,
    p_days_to: params.daysTo,
    p_tz: params.tz,
  });
  if (error) throw error;
  return data;
}
