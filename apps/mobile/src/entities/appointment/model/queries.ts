/**
 * Appointment query + mutation hooks. Callers pass the master's `userId`. A write can
 * change ranges, the actionable list, calendar day counts, a client's appointment
 * count, and analytics, so every mutation invalidates that whole set on `onSettled`.
 */
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  countClientAppointments,
  countClientVisits,
  createAppointment,
  deleteAppointment,
  getAppointment,
  listActionableAppointments,
  listAppointmentsByRange,
  updateAppointment,
} from '../api/appointment.api';
import type { CreateAppointmentDto, UpdateAppointmentDto } from './types';

export const appointmentKeys = {
  /** Prefix for every range/client-count query — invalidating this covers them all. */
  all: (userId: string) => ['appointments', userId] as const,
  range: (userId: string, from: string, to: string) => ['appointments', userId, from, to] as const,
  clientCount: (userId: string, clientId: string) =>
    ['appointments', userId, 'client-count', clientId] as const,
  clientVisits: (userId: string, clientId: string) =>
    ['appointments', userId, 'client-visits', clientId] as const,
  actionable: (userId: string) => ['appointments-actionable', userId] as const,
  detail: (id: string) => ['appointment', id] as const,
  dayCounts: (userId: string) => ['appointment-day-counts', userId] as const,
};

/** Invalidate everything a create/update/delete can affect. */
export function invalidateAppointmentCaches(qc: QueryClient, userId: string): void {
  qc.invalidateQueries({ queryKey: appointmentKeys.all(userId) });
  qc.invalidateQueries({ queryKey: appointmentKeys.actionable(userId) });
  qc.invalidateQueries({ queryKey: appointmentKeys.dayCounts(userId) });
  qc.invalidateQueries({ queryKey: ['analytics', userId] });
}

export function useAppointmentsRangeQuery(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: appointmentKeys.range(userId, from, to),
    queryFn: () => listAppointmentsByRange(userId, from, to),
    enabled: !!userId && !!from && !!to,
  });
}

export function useActionableAppointmentsQuery(userId: string) {
  return useQuery({
    queryKey: appointmentKeys.actionable(userId),
    queryFn: () => listActionableAppointments(userId),
    enabled: !!userId,
  });
}

export function useAppointmentQuery(id: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.detail(id ?? ''),
    queryFn: () => getAppointment(id!),
    enabled: !!id,
  });
}

export function useClientAppointmentCountQuery(userId: string, clientId: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.clientCount(userId, clientId ?? ''),
    queryFn: () => countClientAppointments(userId, clientId!),
    enabled: !!userId && !!clientId,
  });
}

export function useClientVisitCountQuery(userId: string, clientId: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.clientVisits(userId, clientId ?? ''),
    queryFn: () => countClientVisits(userId, clientId!),
    enabled: !!userId && !!clientId,
  });
}

export function useCreateAppointmentMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAppointmentDto) => createAppointment(userId, dto),
    onSettled: () => invalidateAppointmentCaches(qc, userId),
  });
}

export function useUpdateAppointmentMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateAppointmentDto) => updateAppointment(dto),
    onSettled: (_data, _error, dto) => {
      invalidateAppointmentCaches(qc, userId);
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(dto.id) });
    },
  });
}

export function useDeleteAppointmentMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSettled: (_data, _error, id) => {
      invalidateAppointmentCaches(qc, userId);
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
    },
  });
}
