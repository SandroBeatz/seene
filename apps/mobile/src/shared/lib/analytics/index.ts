/**
 * Product-analytics facade. Call sites use `track()` and never depend on a vendor.
 * No-op until a vendor is chosen (Q-PROD-1) and `featureFlags.productAnalytics` is on.
 * See docs/mobile-architecture.md §8.
 */
import { featureFlags } from '@/shared/config/feature-flags';

export type AnalyticsEvent = string;
export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (!featureFlags.productAnalytics) return;
  // TODO(Q-PROD-1): forward to the chosen vendor (PostHog/Amplitude/…).
  if (__DEV__) console.log('[analytics]', event, props ?? {});
}

export function identify(userId: string, traits?: AnalyticsProps): void {
  if (!featureFlags.productAnalytics) return;
  if (__DEV__) console.log('[analytics] identify', userId, traits ?? {});
}
