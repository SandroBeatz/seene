/**
 * CLDR plural category for a count, for the app's three languages. Hermes ships
 * without a reliable Intl.PluralRules, so i18next's built-in plurals are not used:
 * keys are suffixed explicitly — t(`…_${pluralCategory(n, lng)}`, { count: n }).
 */
import type { AppLocale } from './locale.store';

export type PluralCategory = 'one' | 'few' | 'many' | 'other';

export function pluralCategory(count: number, locale: AppLocale): PluralCategory {
  const n = Math.abs(Math.trunc(count));
  if (locale === 'ru') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'one';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
    return 'many';
  }
  // French treats 0 and 1 as singular; English only 1.
  if (locale === 'fr') return n <= 1 ? 'one' : 'other';
  return n === 1 ? 'one' : 'other';
}
