/** Expense entity — public barrel. */
export {
  expenseKeys,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useExpenseQuery,
  useExpensesRangeQuery,
  useUpdateExpenseMutation,
} from './model/queries';
export { EXPENSE_CATEGORIES, type ExpenseCategory } from './config/categories';
export type { Expense, ExpenseInput, UpdateExpenseDto } from './model/types';
