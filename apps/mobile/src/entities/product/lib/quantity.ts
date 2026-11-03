/** Typed quantities and what links a product to a service. Pure; unit-tested. */

/** Stored numbers keep two decimals, and floats must not add noise to them. */
export const hundredths = (value: number) => Math.round(value * 100) / 100;

/** A typed amount: "1,5" → 1.5. Null when it isn't a number that can be stored. */
export function parseQuantity(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  if (!text.trim() || !Number.isFinite(value) || value < 0 || value >= 1e8) return null;
  return hundredths(value);
}

/** One step of the − and + buttons, never below zero, keeping any fraction typed. */
export function stepQuantity(text: string, step: 1 | -1): string {
  const value = parseQuantity(text) ?? 0;
  return String(Math.max(0, hundredths(value + step)));
}

/** "Маникюр" / "Маникюр + 2". Empty when nothing is linked. */
export function linkedSummary(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names[0]} + ${names.length - 1}`;
}

/** What a service uses, by product, as the form holds it. */
export function linksOfService(
  products: readonly { id: string; services: { service_id: string; quantity: number }[] }[],
  serviceId: string,
): Record<string, string> {
  const links: Record<string, string> = {};
  for (const product of products) {
    const link = product.services.find((s) => s.service_id === serviceId);
    if (link) links[product.id] = String(link.quantity);
  }
  return links;
}

/** Every picked link has an amount that comes off the stock. */
export const linksValid = (links: Record<string, string>) =>
  Object.values(links).every((quantity) => (parseQuantity(quantity) ?? 0) > 0);

/** The same links and amounts, however they were typed: "1,5" is "1.5". */
export function sameLinks(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => b[key] !== undefined && parseQuantity(a[key]) === parseQuantity(b[key]))
  );
}
