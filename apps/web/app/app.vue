<script setup>
const { getLocale } = useI18n()
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl || useRequestURL().origin

useHead({
  title: 'Seene',
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  // The page's language, so search engines and screen readers read it right.
  htmlAttrs: {
    lang: () => getLocale()
  }
})

// OG-01: the link preview in WhatsApp and Telegram (JPG: not every messenger shows WebP)
useSeoMeta({
  ogSiteName: 'Seene',
  ogImage: `${siteUrl}/og-01-share.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
