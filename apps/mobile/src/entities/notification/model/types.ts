import type { Tables } from '@/shared/api/database.types';

export type NotificationKind = 'booking_new' | 'booking_cancelled' | 'booking_moved';

export type NotificationCategory = 'visits' | 'clients' | 'money' | 'seene';

/** What the database stored about the visit when it happened. */
export interface VisitPayload {
  client_name?: string | null;
  start_at?: string | null;
  from_start_at?: string | null;
  services?: string[];
  price?: number | null;
}

export type Notification = Omit<Tables<'notification'>, 'kind' | 'payload'> & {
  kind: NotificationKind;
  payload: VisitPayload;
};
