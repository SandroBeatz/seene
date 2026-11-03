/** The "Способы оплаты" list. Pure. */
import type { PaymentType } from '@/entities/payment-type';

/** The design's order; the database's sort_order can differ for rows seeded later. */
const SYSTEM_ORDER = ['cash', 'transfer', 'card', 'qr'] as const;

type Method = Pick<PaymentType, 'id' | 'kind' | 'is_active' | 'sort_order'>;

export function systemMethods<M extends Method>(methods: readonly M[]): M[] {
  return SYSTEM_ORDER.flatMap((kind) => methods.filter((m) => m.kind === kind));
}

export function customMethods<M extends Method>(methods: readonly M[]): M[] {
  return methods.filter((m) => m.kind === 'custom');
}

/** Checkout needs something to pick: the last method that's on stays on. */
export function isLastActive(method: Method, methods: readonly Method[]): boolean {
  return method.is_active && methods.filter((m) => m.is_active).length === 1;
}

/** A new method goes after every other one. */
export function nextMethodOrder(methods: readonly Pick<Method, 'sort_order'>[]): number {
  return Math.max(-1, ...methods.map((m) => m.sort_order)) + 1;
}
