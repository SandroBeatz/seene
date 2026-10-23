/**
 * A master's page lives at /<username>. The same rule is enforced by the
 * `master_profile_username_format` CHECK in the database and by the master app
 * (apps/mobile/src/entities/master/model/queries.ts): keep all three in sync.
 *
 * Lowercase letters, digits, '_' and '-', 3-30 characters, starting with a
 * letter or digit. No dots: they read as a file extension in a URL.
 */
export const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/

/** Paths of the site itself; a master cannot take them. */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'about',
  'admin',
  'api',
  'app',
  'assets',
  'blog',
  'book',
  'booking',
  'c',
  'calculator',
  'compare',
  'en',
  'fr',
  'help',
  'login',
  'master',
  'masters',
  'pricing',
  'privacy',
  'ru',
  'seene',
  'signup',
  'static',
  'support',
  'terms',
  'waitlist',
  'www'
])

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value) && !RESERVED_USERNAMES.has(value)
}
