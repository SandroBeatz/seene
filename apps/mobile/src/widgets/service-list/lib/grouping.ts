/** The list's shape (design AppSvcList): directions, their categories, then services. */
import { SPECIALIZATION_KEYS } from '@/shared/config/specializations';

interface GroupableService {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  specialization: string | null;
  category_id: string | null;
}

interface CategoryRef {
  id: string;
  name: string;
  sort_order: number;
}

export interface CategoryGroup<S> {
  /** Null = the services without a category. */
  category: CategoryRef | null;
  services: S[];
}

export interface DirectionGroup<S> {
  /** Null = old services that never got a direction. */
  specialization: string | null;
  count: number;
  categories: CategoryGroup<S>[];
}

export const byOrder = (a: { sort_order: number; name: string }, b: { sort_order: number; name: string }) =>
  a.sort_order - b.sort_order || a.name.localeCompare(b.name);

/** The master's directions in their order, then any other a service still has. */
export function directionOrder(
  mine: readonly string[],
  services: readonly { specialization: string | null }[],
): string[] {
  const used = new Set(services.map((s) => s.specialization).filter((key) => key !== null));
  const others = SPECIALIZATION_KEYS.filter((key) => used.has(key) && !mine.includes(key));
  return [...mine, ...others];
}

/**
 * The whole list with a dragged group in its new order, in the places the group held.
 * `sort_order` is read across groups (the booking page has no directions), so numbering
 * one group from 1 would mix it into the others.
 */
export function withGroupOrder(all: readonly string[], group: readonly string[]): string[] {
  const members = new Set(group);
  let next = 0;
  return all.map((id) => (members.has(id) ? group[next++] : id));
}

export function groupServices<S extends GroupableService>(
  services: readonly S[],
  categories: readonly CategoryRef[],
  mine: readonly string[],
): DirectionGroup<S>[] {
  const active = services.filter((service) => service.is_active);
  const orderedCategories = [...categories].sort(byOrder);
  const known = new Set(categories.map((c) => c.id));
  const direction = (specialization: string | null): DirectionGroup<S> => {
    const own = active.filter((s) => s.specialization === specialization).sort(byOrder);
    const groups: CategoryGroup<S>[] = orderedCategories.map((category) => ({
      category,
      services: own.filter((s) => s.category_id === category.id),
    }));
    groups.push({
      category: null,
      services: own.filter((s) => !s.category_id || !known.has(s.category_id)),
    });
    return {
      specialization,
      count: own.length,
      categories: groups.filter((group) => group.services.length > 0),
    };
  };
  return [...directionOrder(mine, active), null]
    .map(direction)
    .filter((group) => group.count > 0);
}
