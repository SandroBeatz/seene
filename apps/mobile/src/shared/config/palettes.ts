/**
 * Fixed colour sets and enumerations shared across entities (domain-model.md §4).
 * Single source of truth — never inline these literals. Values are anchored on the
 * Seene violet and should be reconciled against the web palettes during the design
 * pass (Q-DS-1) so services/payments render identically across apps.
 */
import type { SpecializationKey } from '@/shared/config/specializations';
import { avatarGradients, servicePalette, type AvatarColorKey } from '@/shared/theme/tokens';

/**
 * Service calendar colours — one per profession section, stored on `service.color`
 * as hex. Appointments take their service's colour.
 */
export const SERVICE_COLOR_KEYS = Object.keys(servicePalette) as ServiceColorKey[];
export type ServiceColorKey = keyof typeof servicePalette;
export const SERVICE_COLORS = servicePalette;

/** Each profession section's colour: its services start with it, its tile rings in it. */
export const SPECIALIZATION_COLORS: Record<SpecializationKey, ServiceColorKey> = {
  lashes: 'lavender',
  brows: 'sand',
  manicure: 'powder',
  pedicure: 'peach',
  hair: 'sky',
  barbers: 'slate',
  makeup: 'dustyRose',
  skincare: 'sage',
  hair_removal: 'teal',
  massage: 'mint',
  permanent_makeup: 'rosyBeige',
  tattoo: 'graphite',
  piercing: 'lilac',
  pet_grooming: 'olive',
};

/** A service with no section of its own (direct inserts) gets manicure's powder pink. */
export const DEFAULT_SERVICE_COLOR = servicePalette.powder;

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

export type ServiceColor = (typeof SERVICE_COLORS)[ServiceColorKey];
export type PaymentColor = (typeof PAYMENT_COLORS)[number];
export type { AvatarColorKey };

function hashOf(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/** Stable index into CLIENT_INITIAL_HUES from an arbitrary string (name/id). */
export function initialHueFor(seed: string): string {
  return CLIENT_INITIAL_HUES[hashOf(seed) % CLIENT_INITIAL_HUES.length];
}

/** The nine client avatar backgrounds, in the picker's order. */
export const AVATAR_COLOR_KEYS = Object.keys(avatarGradients) as AvatarColorKey[];
export const AVATAR_GRADIENTS = avatarGradients;

export function isAvatarColorKey(value: string | null | undefined): value is AvatarColorKey {
  return !!value && value in avatarGradients;
}

/** The client's chosen background, or a stable one from their name. */
export function avatarColorFor(color: string | null | undefined, seed: string): AvatarColorKey {
  return isAvatarColorKey(color) ? color : AVATAR_COLOR_KEYS[hashOf(seed) % AVATAR_COLOR_KEYS.length];
}
