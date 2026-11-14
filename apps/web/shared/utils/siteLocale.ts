import { DEFAULT_LOCALE, isValidLocale, localeOfPath, type Locale } from './masterLocale'

/**
 * Language of the marketing site (landing, pricing, legal pages): not the
 * master's pages, which follow the master's own language.
 *
 * The visitor's own choice wins and is kept in a cookie. Without one, the
 * language is guessed from the device's time zone, not the browser language:
 * a phone set to English in Bishkek still gets the Russian site.
 */

/** Cookie that keeps the language picked in the site footer. */
export const SITE_LOCALE_COOKIE = 'seene-locale'

/** Marketing pages, without a locale prefix. */
const SITE_PATHS = new Set(['/', '/pricing', '/about', '/calculator', '/privacy', '/terms'])

// Russia, Belarus and Central Asia / the Caucasus, where Russian is the common language.
const RU_ZONES = new Set([
  'Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Europe/Volgograd',
  'Europe/Saratov', 'Europe/Ulyanovsk', 'Europe/Astrakhan', 'Europe/Kirov',
  'Europe/Simferopol', 'Europe/Minsk', 'Europe/Chisinau',
  'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Barnaul',
  'Asia/Tomsk', 'Asia/Novokuznetsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk',
  'Asia/Chita', 'Asia/Yakutsk', 'Asia/Khandyga', 'Asia/Vladivostok',
  'Asia/Ust-Nera', 'Asia/Magadan', 'Asia/Sakhalin', 'Asia/Srednekolymsk',
  'Asia/Kamchatka', 'Asia/Anadyr',
  'Asia/Bishkek', 'Asia/Almaty', 'Asia/Qostanay', 'Asia/Aqtobe', 'Asia/Aqtau',
  'Asia/Atyrau', 'Asia/Oral', 'Asia/Qyzylorda', 'Asia/Tashkent',
  'Asia/Samarkand', 'Asia/Dushanbe', 'Asia/Ashgabat', 'Asia/Baku', 'Asia/Yerevan'
])

// France, French-speaking Europe and overseas France.
const FR_ZONES = new Set([
  'Europe/Paris', 'Europe/Monaco', 'Europe/Luxembourg', 'Europe/Brussels',
  'America/Guadeloupe', 'America/Martinique', 'America/Cayenne',
  'America/Miquelon', 'America/St_Barthelemy', 'America/Marigot',
  'Indian/Reunion', 'Indian/Mayotte', 'Pacific/Tahiti', 'Pacific/Noumea',
  'Pacific/Wallis', 'Pacific/Marquesas', 'Pacific/Gambier',
  'Africa/Dakar', 'Africa/Abidjan', 'Africa/Algiers', 'Africa/Tunis'
])

/** The site language for a device time zone (`Intl…resolvedOptions().timeZone`). */
export function localeOfTimeZone(timeZone: string | null | undefined): Locale {
  if (!timeZone) return DEFAULT_LOCALE
  if (RU_ZONES.has(timeZone)) return 'ru'
  if (FR_ZONES.has(timeZone)) return 'fr'
  return DEFAULT_LOCALE
}

/** Whether the path (with or without a locale prefix) is a marketing page. */
export function isSitePath(path: string): boolean {
  const bare = path.replace(/^\/(en|fr|ru)(?=\/|$)/, '').replace(/\/+$/, '') || '/'
  return SITE_PATHS.has(bare)
}

/**
 * The locale to move the visitor to on their first page, or `null` to stay.
 *
 * Only an unprefixed address is "no language chosen": `/ru/pricing` opened from a
 * link stays Russian. The saved choice wins over the time zone.
 */
export function resolveSiteLocale(
  path: string,
  saved: string | null | undefined,
  timeZone: string | null | undefined
): Locale | null {
  if (!isSitePath(path)) return null
  if (/^\/(en|fr|ru)(?=\/|$)/.test(path)) return null

  const target = isValidLocale(saved) ? saved : localeOfTimeZone(timeZone)
  return target === localeOfPath(path) ? null : target
}
