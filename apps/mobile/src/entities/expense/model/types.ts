/** Expense domain types. Row `category` is narrowed to the fixed union. */
import type { Tables } from '@/shared/api/database.types';
import type { ExpenseCategory } from '../config/categories';

type ExpenseRow = Tables<'expense'>;

export interface Expense extends Omit<ExpenseRow, 'category'> {
  category: ExpenseCategory;
}

export interface ExpenseInput {
  category: ExpenseCategory;
  amount: number;
  /** "yyyy-MM-dd", the master's calendar day. */
  spent_on: string;
  note: string | null;
  repeat_monthly: boolean;
}

export interface UpdateExpenseDto extends ExpenseInput {
  id: string;
}
