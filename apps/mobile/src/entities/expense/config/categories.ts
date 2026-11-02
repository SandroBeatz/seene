/**
 * The built-in expense categories (design "Новый расход"), first = the sheet's default.
 * `expense.category` holds one of these keys or the name of a master's own category.
 */
export const EXPENSE_CATEGORIES = [
  'materials',
  'rent',
  'tools',
  'ads',
  'education',
  'transport',
] as const;

/** Not offered any more, but older rows can still have it. */
const LEGACY_CATEGORIES: readonly string[] = ['other'];

const isBuiltIn = (category: string) =>
  (EXPENSE_CATEGORIES as readonly string[]).includes(category) ||
  LEGACY_CATEGORIES.includes(category);

/** A category's name: short on a chip, full in a list. A master's own is its name as typed. */
export function expenseCategoryLabel(
  category: string,
  t: (key: string) => string,
  form: 'chip' | 'full' = 'full',
): string {
  if (!isBuiltIn(category)) return category;
  return t(`expenses.${form === 'chip' ? 'categories' : 'categoryNames'}.${category}`);
}
