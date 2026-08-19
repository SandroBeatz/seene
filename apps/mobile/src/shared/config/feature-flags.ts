/**
 * Typed feature flags. Read via `useFeatureFlag('name')` or `featureFlags.name`.
 * Remote flags can be layered on later; for now these are build-time constants.
 * See docs/mobile-architecture.md §8.
 */
export const featureFlags = {
  /** Apple Sign In — OFF until an Apple Developer account exists (Q-PROD-2). */
  appleSignIn: false,
  /** Google native OAuth on the auth screens. */
  googleSignIn: true,
  /** Google Places address autocomplete — OFF for MVP; manual entry only (Q-PROD-3). */
  googlePlaces: false,
  /** Query-cache offline persistence + paused mutations (Q-ARCH-4). */
  offlineMode: true,
  /** Product analytics facade — no-op until a vendor is chosen (Q-PROD-1). */
  productAnalytics: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
