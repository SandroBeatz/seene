/** The list's filters and the form's numbers. Pure; unit-tested. */
export interface ListProduct {
  name: string;
  type: string;
  stock: number;
  low_stock: number;
}

export type TypeFilter = 'all' | 'work' | 'sale';

export function filterProducts<P extends ListProduct>(
  products: readonly P[],
  options: { query: string; type: TypeFilter; lowOnly: boolean },
): P[] {
  const query = options.query.trim().toLocaleLowerCase();
  return products.filter(
    (product) =>
      (options.type === 'all' || product.type === options.type) &&
      (!options.lowOnly || product.stock < product.low_stock) &&
      (!query || product.name.toLocaleLowerCase().includes(query)),
  );
}

/** A typed amount: "1,5" → 1.5. Null when it isn't a number that can be stored. */
export function parseQuantity(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  if (!text.trim() || !Number.isFinite(value) || value < 0 || value >= 1e8) return null;
  return Math.round(value * 100) / 100;
}

/** One step of the − and + buttons, never below zero, keeping any fraction typed. */
export function stepQuantity(text: string, step: 1 | -1): string {
  const value = parseQuantity(text) ?? 0;
  return String(Math.max(0, Math.round((value + step) * 100) / 100));
}

/** Money and floats: 3.3 − 3.1 must not save as 0.1999… */
export const stockDelta = (next: number, before: number) => Math.round((next - before) * 100) / 100;

/** "Маникюр" / "Маникюр + 2". Empty when nothing is linked. */
export function linkedSummary(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names[0]} + ${names.length - 1}`;
}
