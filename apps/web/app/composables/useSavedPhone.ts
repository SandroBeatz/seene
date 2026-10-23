const STORAGE_KEY = 'seene_phone'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * The client's phone remembered on this device, so the next booking (with any
 * master) starts with it filled in. Stored in canonical form only — digits,
 * no '+' (see `shared/utils/phone.ts`).
 *
 * A first-party cookie is the primary store: it is readable during SSR (the
 * field renders pre-filled) and survives in in-app browsers (Telegram,
 * Instagram) where it lives in the app's WebView data store. localStorage is a
 * backup for when the cookie is gone. Each browser / app keeps its own storage,
 * so the number is remembered per browser, not across apps.
 */
export function useSavedPhone() {
  const cookie = useCookie<string | null>(STORAGE_KEY, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
    path: '/',
    default: () => null,
    // Keep the raw digits; the default JSON decoder would turn them into a number.
    encode: (value) => value ?? '',
    decode: (value) => value
  })

  function read(): string {
    const fromCookie = toCanonicalPhone(cookie.value ?? '')
    if (fromCookie) return fromCookie
    if (!import.meta.client) return ''

    const fromStorage = toCanonicalPhone(readStorage() ?? '')
    // Heal the cookie so the next visit is pre-filled on the server too.
    if (fromStorage) cookie.value = fromStorage
    return fromStorage ?? ''
  }

  function save(phone: string) {
    const canonical = toCanonicalPhone(phone)
    if (!canonical) return
    if (cookie.value !== canonical) cookie.value = canonical
    writeStorage(canonical)
  }

  return { read, save }
}

function readStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStorage(value: string) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Private mode / blocked storage: the cookie still holds the number.
  }
}
