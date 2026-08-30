/**
 * Fixed colour sets and enumerations shared across entities (domain-model.md §4).
 * Single source of truth — never inline these literals. Values are anchored on the
 * Seene violet and should be reconciled against the web palettes during the design
 * pass (Q-DS-1) so services/payments render identically across apps.
 */

/** Service colour swatches. The first entry is the default for a new service. */
export const SERVICE_COLORS = [
  '#a78bfa', // default (violet)
  '#f472b6',
  '#fb7185',
  '#f59e0b',
  '#facc15',
  '#34d399',
  '#22d3ee',
  '#60a5fa',
  '#818cf8',
  '#c084fc',
] as const;
export const DEFAULT_SERVICE_COLOR = SERVICE_COLORS[0];

/** Custom payment-method swatches (system cash/card get their own fixed colours). */
export const PAYMENT_COLORS = [
  '#34d399',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
  '#fb7185',
  '#f59e0b',
  '#facc15',
  '#22d3ee',
  '#818cf8',
  '#94a3b8',
] as const;

/** Deterministic hue set for client initial avatars (index = hash(name) % 8). */
export const CLIENT_INITIAL_HUES = [
  '#a78bfa',
  '#f472b6',
  '#fb7185',
  '#f59e0b',
  '#34d399',
  '#22d3ee',
  '#60a5fa',
  '#c084fc',
] as const;

/** Allowed service durations, in minutes. */
export const SERVICE_DURATIONS = [15, 30, 45, 60, 90, 120] as const;
export type ServiceDuration = (typeof SERVICE_DURATIONS)[number];

export type ServiceColor = (typeof SERVICE_COLORS)[number];
export type PaymentColor = (typeof PAYMENT_COLORS)[number];

/** Stable index into CLIENT_INITIAL_HUES from an arbitrary string (name/id). */
export function initialHueFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return CLIENT_INITIAL_HUES[Math.abs(hash) % CLIENT_INITIAL_HUES.length];
}
