/**
 * Pure availability/scheduling math — the app's core (RS-1/RS-2).
 *
 * PLACEHOLDER: the real implementation (findAvailableSlots, findFreeIntervals,
 * hasAnyFreeSlot, slot grouping, classifyDayState) is ported in Phase 3 WITH
 * exhaustive unit tests BEFORE the quick-create wizard is wired
 * (docs/roadmap.md Phase 3, mobile-architecture.md §10 rule 8).
 *
 * This module must never import from `entities/*` — it composes appointments and
 * time-blocks and therefore lives in `shared`.
 */
export interface TimeInterval {
  /** UTC ISO */
  start: string;
  /** UTC ISO */
  end: string;
}

export {};
