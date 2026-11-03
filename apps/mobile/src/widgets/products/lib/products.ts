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

/** Money and floats: 3.3 − 3.1 must not save as 0.1999… */
export const stockDelta = (next: number, before: number) => Math.round((next - before) * 100) / 100;

const hundredths = (value: number) => Math.round(value * 100) / 100;

/** A stored amount as packages: 48 ml in bottles of 10 ml is 4.8. */
export const toPackages = (amount: number, packSize: number) => hundredths(amount / packSize);

/**
 * A stored number once the form's content is saved: amounts and counts convert when the content
 * is added or removed, the way save_product converts the stock. `packNow` is null without one.
 */
export function rebaseAmount(
  stored: number,
  before: { measured: boolean; packSize: number },
  packNow: number | null,
): number {
  if (before.measured === (packNow !== null)) return stored;
  return hundredths(packNow !== null ? stored * packNow : stored / before.packSize);
}

/** What one unit costs out of a package. Null when unknown or too small to show as money. */
export function unitCost(price: number | null, packSize: number | null): number | null {
  if (price === null || !packSize) return null;
  const cost = Math.round((price / packSize) * 100) / 100;
  return cost > 0 ? cost : null;
}
