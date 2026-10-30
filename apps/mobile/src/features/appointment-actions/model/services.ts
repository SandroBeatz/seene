/**
 * The appointment's services sheet (design "Запись · услуги"): services grouped by
 * direction (profession section) and category, a search, and the visit's duration
 * and price — "Как в прайсе" or set for this appointment only. Pure.
 */

export interface PickableService {
  id: string;
  name: string;
  duration: number;
  price: number;
  is_active: boolean;
  sort_order: number;
  specialization: string | null;
  category: { id: string; name: string } | null;
}

/** A service without a section falls under "Другое". */
export const OTHER_DIRECTION = 'other';

export const directionOf = (s: Pick<PickableService, 'specialization'>) =>
  s.specialization ?? OTHER_DIRECTION;

/** Directions in price-list order (by each one's first service). */
export function directions(services: readonly PickableService[]): string[] {
  return [...new Set([...services].sort(bySortOrder).map(directionOf))];
}

/** Categories of one direction in price-list order; uncategorised services share `null`. */
export function categoriesOf(
  services: readonly PickableService[],
  direction: string,
): { id: string | null; name: string | null }[] {
  const seen = new Map<string | null, string | null>();
  for (const s of [...services].sort(bySortOrder)) {
    if (directionOf(s) !== direction) continue;
    const id = s.category?.id ?? null;
    if (!seen.has(id)) seen.set(id, s.category?.name ?? null);
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

const bySortOrder = (a: PickableService, b: PickableService) => a.sort_order - b.sort_order;

export interface ServiceGroup<S extends PickableService> {
  direction: string;
  /** Null = no category. */
  category: string | null;
  /** Show the direction header before this group ("Все", no search). */
  directionHeader: boolean;
  /** Show the category caption (several categories in the direction, no search). */
  categoryCaption: boolean;
  items: S[];
}

export interface ServiceFilter {
  /** 'all' or a direction key. */
  direction: string;
  /** 'all' or a category id ('' = uncategorised). */
  category: string;
  query: string;
}

/**
 * The list the sheet shows: active services plus any already on the appointment,
 * filtered by direction, category and a name search.
 */
export function groupServices<S extends PickableService>(
  services: readonly S[],
  selected: ReadonlySet<string>,
  filter: ServiceFilter,
): ServiceGroup<S>[] {
  const query = filter.query.trim().toLocaleLowerCase();
  const visible = [...services]
    .sort(bySortOrder)
    .filter((s) => s.is_active || selected.has(s.id))
    .filter((s) => !query || s.name.toLocaleLowerCase().includes(query));

  const groups: ServiceGroup<S>[] = [];
  for (const direction of directions(visible)) {
    if (filter.direction !== 'all' && filter.direction !== direction) continue;
    const categories = categoriesOf(visible, direction);
    categories.forEach((category, index) => {
      if (filter.category !== 'all' && filter.category !== (category.id ?? '')) return;
      const items = visible.filter(
        (s) => directionOf(s) === direction && (s.category?.id ?? null) === category.id,
      );
      if (!items.length) return;
      groups.push({
        direction,
        category: category.name,
        directionHeader: filter.direction === 'all' && !query && index === 0,
        // Uncategorised services get a caption too ("Без категории") next to other categories.
        categoryCaption: !query && filter.category === 'all' && categories.length > 1,
        items,
      });
    });
  }
  return groups;
}

export interface VisitTotals {
  /** Σ of the selected services as in the price list. */
  listDuration: number;
  listPrice: number;
}

export function totalsOf(
  services: readonly PickableService[],
  selected: ReadonlySet<string>,
): VisitTotals {
  let listDuration = 0;
  let listPrice = 0;
  for (const s of services) {
    if (!selected.has(s.id)) continue;
    listDuration += s.duration;
    listPrice += s.price;
  }
  return { listDuration, listPrice };
}

/** Digits of a typed amount ("2 500" → 2500), or null when empty. */
export function parseAmount(input: string): number | null {
  const digits = input.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

/**
 * What to save: the typed duration/price, or the list values when left as is. A price
 * equal to the list price is stored as `null` (follows the price list).
 */
export function resolveVisit(
  totals: VisitTotals,
  durationInput: string | null,
  priceInput: string | null,
): { duration: number; price: number | null } {
  const duration = durationInput === null ? totals.listDuration : (parseAmount(durationInput) ?? 0);
  const typed = priceInput === null ? null : parseAmount(priceInput);
  return { duration, price: typed === null || typed === totals.listPrice ? null : typed };
}

/** Duration bounds the database accepts for a visit. */
export const VISIT_MIN_MINUTES = 5;
export const VISIT_MAX_MINUTES = 1440;
