/**
 * Analytics hooks. Keys are prefixed `['analytics', userId, …]`: appointment and expense
 * writes invalidate that prefix, so a checkout or a new expense refreshes these too.
 * The previous period stays on screen while the next one loads.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getMoneyClients, getMoneyOverview, listSaleOperations } from '../api/analytics.api';
import type { MoneyOverviewParams } from './types';

export const analyticsKeys = {
  overview: (userId: string, params: MoneyOverviewParams) =>
    ['analytics', userId, 'overview', params] as const,
  clients: (userId: string, from: string, to: string) =>
    ['analytics', userId, 'clients', from, to] as const,
  operations: (userId: string, from: string, to: string) =>
    ['analytics', userId, 'operations', from, to] as const,
};

export function useMoneyOverviewQuery(userId: string, params: MoneyOverviewParams) {
  return useQuery({
    queryKey: analyticsKeys.overview(userId, params),
    queryFn: () => getMoneyOverview(params),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}

export function useMoneyClientsQuery(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: analyticsKeys.clients(userId, from, to),
    queryFn: () => getMoneyClients(from, to),
    enabled: !!userId,
  });
}

export function useSaleOperationsQuery(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: analyticsKeys.operations(userId, from, to),
    queryFn: () => listSaleOperations(userId, from, to),
    enabled: !!userId,
  });
}
