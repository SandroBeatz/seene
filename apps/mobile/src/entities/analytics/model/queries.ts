/**
 * Analytics query hooks. Callers pass `userId` for cache isolation (the RPC itself is
 * auth-scoped). Keys are prefixed `['analytics', userId, …]` so appointment mutations
 * that invalidate `['analytics', userId]` refresh these too.
 */
import { useQuery } from '@tanstack/react-query';
import { getAnalytics, getAnalyticsWidgets } from '../api/analytics.api';
import type { AnalyticsParams, AnalyticsWidgetsParams } from './types';

export const analyticsKeys = {
  summary: (userId: string, params: AnalyticsParams) =>
    ['analytics', userId, 'summary', params] as const,
  widgets: (userId: string, params: AnalyticsWidgetsParams) =>
    ['analytics', userId, 'widgets', params] as const,
};

export function useAnalyticsQuery(userId: string, params: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.summary(userId, params),
    queryFn: () => getAnalytics(params),
    enabled: !!userId && !!params.from && !!params.to,
  });
}

export function useAnalyticsWidgetsQuery(userId: string, params: AnalyticsWidgetsParams) {
  return useQuery({
    queryKey: analyticsKeys.widgets(userId, params),
    queryFn: () => getAnalyticsWidgets(params),
    enabled: !!userId && !!params.topFrom && !!params.topTo,
  });
}
