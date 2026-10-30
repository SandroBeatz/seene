/**
 * Appointment api — the only supabase import site for this entity. Owner-scoped by RLS;
 * reads still filter `.eq('user_id', userId)`. ⚠️ Deleting an appointment CASCADEs its
 * sale (erases revenue) — callers must confirm destructive deletes in the UI.
 */
import { supabase } from '@/shared/api/supabase';
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  VisitHistoryRow,
} from '../model/types';

/** Appointments starting within [fromIso, toIso). */
export async function listAppointmentsByRange(
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .gte('start_at', fromIso)
    .lt('start_at', toIso)
    .order('start_at');
  if (error) throw error;
  return data as Appointment[];
}

/**
 * Every visit since `fromIso` reduced to who and when: finished ones (a client's
 * rhythm) and booked ones (a visit ahead). Feeds "Пора позвать".
 */
export async function listVisitHistory(userId: string, fromIso: string): Promise<VisitHistoryRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('client_id, start_at, status')
    .eq('user_id', userId)
    .in('status', ['completed', 'pending', 'confirmed'])
    .gte('start_at', fromIso)
    .order('start_at');
  if (error) throw error;
  return data as VisitHistoryRow[];
}

/** Pending, or confirmed and already started — the master's action list. */
export async function listActionableAppointments(userId: string): Promise<Appointment[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .or(`status.eq.pending,and(status.eq.confirmed,start_at.lt.${nowIso})`)
    .order('start_at');
  if (error) throw error;
  return data as Appointment[];
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Appointment | null) ?? null;
}

/** Total appointments for a client (drives the new-vs-returning derivation). */
export async function countClientAppointments(userId: string, clientId: string): Promise<number> {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('client_id', clientId);
  if (error) throw error;
  return count ?? 0;
}

/** The client's finished visits (status `completed`) — "14 визитов". */
export async function countClientVisits(userId: string, clientId: string): Promise<number> {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .eq('status', 'completed');
  if (error) throw error;
  return count ?? 0;
}

export async function createAppointment(
  userId: string,
  dto: CreateAppointmentDto,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...dto, user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function updateAppointment(dto: UpdateAppointmentDto): Promise<Appointment> {
  const { id, ...patch } = dto;
  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Appointment;
}

/** ⚠️ CASCADEs the linked sale (revenue). Confirm in the UI before calling. */
export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
}
