/** The fixed expense categories (design "Новый расход"), first = the sheet's default. */
export const EXPENSE_CATEGORIES = [
  'materials',
  'rent',
  'tools',
  'ads',
  'education',
  'transport',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
