/**
 * Sentry wiring. Enabled only when EXPO_PUBLIC_SENTRY_DSN is set, so local/dev
 * builds don't emit noise. `wrap()` is applied to the root layout; `capture()` is
 * the single call site for manual error reporting. docs/mobile-architecture.md §7.
 */
import * as Sentry from '@sentry/react-native';
import { env } from '@/shared/config/env';

const enabled = !!env.sentryDsn;

export function initSentry(): void {
  Sentry.init({
    dsn: env.sentryDsn || undefined,
    enabled,
    // Lower in production via env later; keep modest tracing off by default.
    tracesSampleRate: 0,
    enableAutoSessionTracking: true,
  });
}

export function capture(error: unknown, context?: Record<string, unknown>): void {
  if (!enabled) {
    if (__DEV__) console.error('[capture]', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export const wrap = Sentry.wrap;
