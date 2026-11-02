/** Expense api — the only supabase import site for this entity. Owner-scoped by RLS. */
import { supabase } from '@/shared/api/supabase';
import type { Expense, ExpenseInput, UpdateExpenseDto } from '../model/types';

const COLUMNS =
  'id, user_id, category, amount, spent_on, note, repeat_monthly, repeat_day, rolled_over, created_at, updated_at';

/** Expenses with `spent_on` in [fromKey, toKey], newest first. */
export async function listExpenses(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expense')
    .select(COLUMNS)
    .eq('user_id', userId)
    .gte('spent_on', fromKey)
    .lte('spent_on', toKey)
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

export async function getExpense(id: string): Promise<Expense> {
  const { data, error } = await supabase.from('expense').select(COLUMNS).eq('id', id).single();
  if (error) throw error;
  return data as Expense;
}

export async function createExpense(userId: string, input: ExpenseInput): Promise<void> {
  const { error } = await supabase.from('expense').insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function updateExpense({ id, ...input }: UpdateExpenseDto): Promise<void> {
  const { error } = await supabase.from('expense').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expense').delete().eq('id', id);
  if (error) throw error;
}
