/**
 * The fixed set of 9 specialization keys (docs/domain-model.md §4). Stored on
 * `master_profile.specializations` as a `text[]` of these keys; display names come
 * from i18n (`onboarding.specializations.<key>`) — never hardcode the label.
 */
export const SPECIALIZATION_KEYS = [
  'makeup',
  'hair',
  'nails',
  'barber',
  'massage',
  'tattoo_piercing',
  'depilation',
  'cosmetology',
  'brows_lashes',
] as const;

export type SpecializationKey = (typeof SPECIALIZATION_KEYS)[number];
