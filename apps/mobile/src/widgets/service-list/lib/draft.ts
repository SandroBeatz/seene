/** The service sheet's rules, pure. */
import { DEFAULT_SERVICE_COLOR, SERVICE_COLORS, SPECIALIZATION_COLORS } from '@/shared/config/palettes';
import type { SpecializationKey } from '@/shared/config/specializations';

/** The design's presets; anything else shows under "Своя". */
export const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;
/** "Перерыв после", minutes. */
export const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60] as const;

const NUMERIC = /^\d+([.,]\d{1,2})?$/;

/** "1800", "1800,50" → the amount; '' → 0 (no price yet); anything else → null. */
export function parsePrice(text: string): number | null {
  const value = text.trim();
  if (!value) return 0;
  return NUMERIC.test(value) ? Number(value.replace(',', '.')) : null;
}

export function directionColor(specialization: string | null): string {
  const key = SPECIALIZATION_COLORS[specialization as SpecializationKey];
  return key ? SERVICE_COLORS[key] : DEFAULT_SERVICE_COLOR;
}

/** A service follows its direction's colour unless the master picked another one. */
export function colorAfterDirectionChange(
  color: string,
  from: string | null,
  to: string | null,
): string {
  return color === directionColor(from) ? directionColor(to) : color;
}

export function nextSortOrder(rows: readonly { sort_order: number }[]): number {
  return Math.max(0, ...rows.map((row) => row.sort_order)) + 1;
}
