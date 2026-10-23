import type { MasterPageData } from '#shared/types/master'

const SCHEMA_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const

const DESCRIPTION_MAX = 160

/**
 * Search and link-preview metadata for a master's page: "Name — specialty, city",
 * a description, the poster as the preview image and schema.org BeautySalon data.
 */
export function useMasterSeo(data: Ref<MasterPageData | undefined>) {
  const { $t, $ts } = useI18n()
  const url = useRequestURL()

  const meta = computed(() => {
    const d = data.value
    if (!d) return null

    const p = d.profile
    const name = `${p.first_name} ${p.last_name}`.trim()
    const specialty = p.specializations.map((key) => $t(`specializations.${key}`)).join(', ')
    const title = [name, [specialty, p.city].filter(Boolean).join(', ')].filter(Boolean).join(' — ')

    const services = d.services
      .slice(0, 3)
      .map((s) => s.name)
      .join(', ')
    const description = truncate(
      p.bio?.trim() ||
        (services
          ? $ts('master.seo.description', { name, services })
          : $ts('master.seo.descriptionShort', { name })),
      DESCRIPTION_MAX
    )

    return { name, title, description, image: p.cover_url || p.avatar_url || undefined }
  })

  useSeoMeta({
    title: () => meta.value?.title,
    description: () => meta.value?.description,
    ogTitle: () => meta.value?.title,
    ogDescription: () => meta.value?.description,
    ogImage: () => meta.value?.image,
    ogType: 'profile',
    ogUrl: url.href,
    twitterCard: () => (data.value?.profile.cover_url ? 'summary_large_image' : 'summary')
  })

  useHead({
    link: [{ rel: 'canonical', href: url.origin + url.pathname }],
    script: [
      {
        type: 'application/ld+json',
        // '<' is escaped so a master's text can never close the script tag.
        innerHTML: () =>
          data.value ? JSON.stringify(structuredData(data.value, url)).replace(/</g, '\\u003c') : ''
      }
    ]
  })
}

function structuredData(d: MasterPageData, url: URL) {
  const p = d.profile
  const sameAs = [
    p.instagram && instagramLink(p.instagram),
    p.telegram && telegramLink(p.telegram)
  ].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: `${p.first_name} ${p.last_name}`.trim(),
    url: url.origin + url.pathname,
    image: [p.cover_url, p.avatar_url].filter(Boolean),
    description: p.bio ?? undefined,
    address: p.city
      ? {
          '@type': 'PostalAddress',
          streetAddress: [p.address, p.house_number].filter(Boolean).join(' ') || undefined,
          addressLocality: p.city,
          postalCode: p.zip_code ?? undefined,
          addressCountry: p.country
        }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    openingHoursSpecification: d.working_hours.map((r) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAYS.slice(r.from - 1, r.to),
      opens: r.start,
      closes: r.end
    })),
    makesOffer: d.services.map((s) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.name, description: s.description ?? undefined },
      price: priceToNumber(s.price),
      priceCurrency: d.settings.currency
    }))
  }
}

function truncate(text: string, max: number) {
  const flat = text.replace(/\s+/g, ' ')
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`
}
