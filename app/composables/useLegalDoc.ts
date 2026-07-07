type LegalDocSlug = 'privacy' | 'terms'

// Legal content still has these to be filled in by hand (legal name, dates,
// contact emails, retention periods) before publishing. The source markdown
// keeps them as `{{TOKEN}}` for a human to find & replace, but MDC's `{{ }}`
// syntax is a live data-binding — an unresolved token silently renders as an
// empty string. Mapping each token back to its own literal string here makes
// it render as-is instead of disappearing.
const LEGAL_PLACEHOLDER_DATA: Record<string, string> = Object.fromEntries(
  [
    'EFFECTIVE_DATE',
    'LAST_UPDATED',
    'OPERATOR_LEGAL_NAME',
    'OPERATOR_ADDRESS',
    'PRIVACY_CONTACT_EMAIL',
    'SUPPORT_CONTACT_EMAIL',
    'RETENTION_LOGS',
    'RETENTION_MASTER',
    'GOVERNING_LAW',
    'LIABILITY_PERIOD',
    'PRICING_TERMS'
  ].map((token) => [token, `{{${token}}}`])
)

/**
 * Legal docs only exist in ru/en (`content/legal/<doc>.<locale>.md`); fr
 * falls back to en since no French legal version exists yet.
 */
export function useLegalDoc(doc: LegalDocSlug) {
  const { getLocale } = useI18n()

  const contentLocale = computed(() => {
    const locale = getLocale()
    return locale === 'en' || locale === 'ru' ? locale : 'en'
  })

  const { data } = useAsyncData(
    `legal-${doc}-${contentLocale.value}`,
    () => queryCollection('legal').path(`/legal/${doc}.${contentLocale.value}`).first(),
    { watch: [contentLocale] }
  )

  return { data, placeholderData: LEGAL_PLACEHOLDER_DATA }
}
