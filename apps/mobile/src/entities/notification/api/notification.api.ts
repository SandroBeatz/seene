/** Notification api — the only supabase import site for this entity. Owner-scoped by RLS. */
import { supabase } from '@/shared/api/supabase';
import type { Notification } from '../model/types';

const FEED_SIZE = 100;

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notification')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(FEED_SIZE);
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notification')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notification')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notification').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteReadNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notification')
    .delete()
    .eq('user_id', userId)
    .not('read_at', 'is', null);
  if (error) throw error;
}
