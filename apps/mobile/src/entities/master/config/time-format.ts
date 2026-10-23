/**
 * Seed `time_format` from the master's country at onboarding Step 3
 * (docs/business-logic.md §3): countries that conventionally use the 12-hour clock
 * get `12`, everyone else `24`. The master can still flip it in Step 4 / settings.
 */
const TWELVE_HOUR_COUNTRIES = new Set([
  'US',
  'CA',
  'AU',
  'NZ',
  'IN',
  'PH',
  'EG',
  'SA',
  'CO',
  'PK',
  'MY',
  'BD',
]);

export type TimeFormat = 12 | 24;

export function defaultTimeFormatForCountry(country: string): TimeFormat {
  return TWELVE_HOUR_COUNTRIES.has(country.trim().toUpperCase()) ? 12 : 24;
}
