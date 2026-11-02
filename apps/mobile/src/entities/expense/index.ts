/** Expense entity — public barrel. */
export {
  expenseKeys,
  useCreateExpenseCategoryMutation,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useExpenseCategoriesQuery,
  useExpenseQuery,
  useExpensesRangeQuery,
  useUpdateExpenseMutation,
} from './model/queries';
export { EXPENSE_CATEGORIES, expenseCategoryLabel } from './config/categories';
export type { CustomExpenseCategory, Expense, ExpenseInput, UpdateExpenseDto } from './model/types';
