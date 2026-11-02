/** Expense domain types. */
import type { Tables } from '@/shared/api/database.types';

export type Expense = Tables<'expense'>;
export type CustomExpenseCategory = Pick<Tables<'expense_category'>, 'id' | 'name'>;

export interface ExpenseInput {
  /** A built-in key or the name of the master's own category. */
  category: string;
  amount: number;
  /** "yyyy-MM-dd", the master's calendar day. */
  spent_on: string;
  note: string | null;
  repeat_monthly: boolean;
}

export interface UpdateExpenseDto extends ExpenseInput {
  id: string;
}
