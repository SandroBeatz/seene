/**
 * Appointment domain types. The Row's `status`/`source` are plain `string` in the DB;
 * the domain narrows them to the fixed unions (domain-model.md §4). Effective status
 * is UI-derived and never stored.
 */
import type { Database } from '@/shared/api/database.types';

type AppointmentRow = Database['public']['Tables']['appointments']['Row'];

export type AppointmentStatus =
  'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'expired';

export type EffectiveAppointmentStatus = AppointmentStatus | 'ongoing' | 'past';
export type AppointmentSource = 'manual' | 'online_booking';

export interface Appointment extends Omit<AppointmentRow, 'status' | 'source'> {
  status: AppointmentStatus;
  source: AppointmentSource;
}

export interface CreateAppointmentDto {
  client_id: string;
  service_ids: string[];
  start_at: string; // UTC ISO
  duration: number; // minutes, NOT NULL (≥1)
  price?: number | null; // null = sum of services
  notes?: string | null;
  status?: AppointmentStatus;
  source?: AppointmentSource;
}

/** Who cancelled: the client by their booking link, or the master in the app. */
export type AppointmentCancelledBy = 'client' | 'master';

export type UpdateAppointmentDto = { id: string } & Partial<
  Omit<CreateAppointmentDto, 'source'>
> & {
    cancelled_by?: AppointmentCancelledBy | null;
    cancelled_at?: string | null;
    cancel_reason?: string | null;
  };
