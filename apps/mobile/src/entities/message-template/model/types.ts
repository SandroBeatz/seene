import type { Tables } from '@/shared/api/database.types';

export type MessageTemplate = Tables<'message_template'>;

export const MESSAGE_KINDS = [
  'confirmation',
  'reminder',
  'recall',
  'review',
  'cancellation',
  'reschedule',
] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export const MESSAGE_LANGUAGES = ['ru', 'en', 'fr'] as const;
export type MessageLanguage = (typeof MESSAGE_LANGUAGES)[number];

export const MESSAGE_VARIABLES = [
  'client_name',
  'date_time',
  'service',
  'price',
  'address',
  'master',
  'booking_link',
  'online_link',
] as const;
export type MessageVariable = (typeof MESSAGE_VARIABLES)[number];

/** `message_template_body_length` in the database. */
export const BODY_MAX_LENGTH = 1000;
