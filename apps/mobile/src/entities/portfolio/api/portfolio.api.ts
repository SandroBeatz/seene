/** Portfolio api: the photos' rows and their files in the public `master-media` bucket. */
import { supabase } from '@/shared/api/supabase';
import { storagePathFromUrl } from '../lib/storage';
import type { PortfolioItem, PortfolioItemPatch } from '../model/types';

const BUCKET = 'master-media';

export async function getPortfolio(userId: string): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from('portfolio_item')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return data;
}

/** Tidying only: the row is already gone or never came, an orphan file costs little. */
async function removeFile(url: string) {
  const path = storagePathFromUrl(url, BUCKET);
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // Removed with the account.
  }
}

export async function addPortfolioPhoto(
  userId: string,
  file: { uri: string; mimeType: string },
  sortOrder: number,
): Promise<void> {
  const response = await fetch(file.uri);
  const ext = file.mimeType.includes('png')
    ? 'png'
    : file.mimeType.includes('webp')
      ? 'webp'
      : 'jpg';
  const path = `${userId}/portfolio-${Date.now()}-${sortOrder}.${ext}`;

  const bucket = supabase.storage.from(BUCKET);
  const upload = await bucket.upload(path, await response.arrayBuffer(), {
    contentType: file.mimeType,
  });
  if (upload.error) throw upload.error;

  const photoUrl = bucket.getPublicUrl(path).data.publicUrl;
  const { error } = await supabase
    .from('portfolio_item')
    .insert({ user_id: userId, photo_url: photoUrl, sort_order: sortOrder });
  if (error) {
    await removeFile(photoUrl);
    throw error;
  }
}

export async function updatePortfolioItem(id: string, patch: PortfolioItemPatch): Promise<void> {
  const { error } = await supabase.from('portfolio_item').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePortfolioItem(item: PortfolioItem): Promise<void> {
  const { error } = await supabase.from('portfolio_item').delete().eq('id', item.id);
  if (error) throw error;
  await removeFile(item.photo_url);
}

export async function reorderPortfolio(ids: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_portfolio', { p_ids: ids });
  if (error) throw error;
}
