import { supabase } from '@/shared/api/supabase';
import type { MessageKind, MessageLanguage, MessageTemplate } from '../model/types';

export async function getMessageTemplates(userId: string): Promise<MessageTemplate[]> {
  const { data, error } = await supabase.from('message_template').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function saveMessageTemplate(
  userId: string,
  kind: MessageKind,
  language: MessageLanguage,
  body: string,
): Promise<void> {
  const { error } = await supabase.from('message_template').upsert({
    user_id: userId,
    kind,
    language,
    body,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Back to the standard text. */
export async function resetMessageTemplate(
  userId: string,
  kind: MessageKind,
  language: MessageLanguage,
): Promise<void> {
  const { error } = await supabase
    .from('message_template')
    .delete()
    .eq('user_id', userId)
    .eq('kind', kind)
    .eq('language', language);
  if (error) throw error;
}

/** A new personal link to the visit, or null when it could no longer work. */
export async function createBookingLink(appointmentId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_booking_link', {
    p_appointment_id: appointmentId,
  });
  if (error) throw error;
  return data;
}
