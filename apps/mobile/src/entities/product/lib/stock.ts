/**
 * How stock is stored and shown, and the list's filters. Pure; unit-tested.
 * With a content unit the stored numbers are amounts ("48 ml"); on screen they are packages.
 */
import type { ProductType } from '../model/types';
import { hundredths } from './quantity';

/** "Заканчивается": below the master's threshold. A threshold of 0 never warns. */
export const isLowStock = (product: { stock: number; low_stock: number }) =>
  product.stock < product.low_stock;

/** A stored amount as packages: 48 ml in bottles of 10 ml is 4.8. */
export const toPackages = (amount: number, packSize: number) => hundredths(amount / packSize);

/** Packages as a stored amount: 4.8 bottles of 10 ml is 48 ml. */
export const fromPackages = (packages: number, packSize: number) => hundredths(packages * packSize);

/**
 * A stored number once the form's content is saved: amounts and counts convert when the content
 * is added or removed, the way save_product converts the stock. A pack is null without content.
 */
export function rebaseAmount(
  stored: number,
  packBefore: number | null,
  packNow: number | null,
): number {
  if (packBefore === null && packNow !== null) return hundredths(stored * packNow);
  if (packBefore !== null && packNow === null) return hundredths(stored / packBefore);
  return stored;
}

/**
 * The change the packages on screen ask for. Taken from what is shown, not from the stored amount:
 * 29 ml of 30 shows as 0.97, and stepping up one bottle must add 30 ml, not 30.1.
 */
export const stockDelta = (packages: number, stored: number, packSize: number) =>
  hundredths((packages - toPackages(stored, packSize)) * packSize);

/** What one ml or g costs out of a package. Null when unknown or too small to show as money. */
export function contentUnitCost(price: number | null, packSize: number | null): number | null {
  if (price === null || !packSize) return null;
  const cost = hundredths(price / packSize);
  return cost > 0 ? cost : null;
}

export type TypeFilter = 'all' | ProductType;

export function filterProducts<
  P extends { name: string; type: string; stock: number; low_stock: number },
>(products: readonly P[], options: { query: string; type: TypeFilter; lowOnly: boolean }): P[] {
  const query = options.query.trim().toLocaleLowerCase();
  return products.filter(
    (product) =>
      (options.type === 'all' || product.type === options.type) &&
      (!options.lowOnly || isLowStock(product)) &&
      (!query || product.name.toLocaleLowerCase().includes(query)),
  );
}

/** What the stock on the shelf cost, at the buying price per package. */
export const shelfValue = (
  products: readonly { stock: number; pack_size: number; buy_price: number | null }[],
) => hundredths(products.reduce((sum, p) => sum + (p.stock / p.pack_size) * (p.buy_price ?? 0), 0));

/**
 * Whole visits the stock lasts, on the average of what the linked services use. Null when no
 * service uses it: then nothing says how fast it goes.
 */
export function visitsLeft(product: {
  stock: number;
  services: readonly { quantity: number }[];
}): number | null {
  if (!product.services.length) return null;
  const perVisit =
    product.services.reduce((sum, s) => sum + s.quantity, 0) / product.services.length;
  return Math.floor(product.stock / perVisit);
}

/** Purchases in the month starting at `monthStart`, and in the one before it. */
export function purchaseTotals(
  purchases: readonly { amount: number | null; created_at: string }[],
  monthStart: string,
): { current: number; previous: number } {
  const start = Date.parse(monthStart);
  let current = 0;
  let previous = 0;
  for (const purchase of purchases) {
    if (Date.parse(purchase.created_at) >= start) current += purchase.amount ?? 0;
    else previous += purchase.amount ?? 0;
  }
  return { current: hundredths(current), previous: hundredths(previous) };
}

/** Whole percent against last month. Null with nothing to compare to or no change. */
export function monthChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100) || null;
}
