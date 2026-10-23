<script setup>
const { getLocale } = useI18n()

useHead({
  title: 'Seene',
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  // The page's language, so search engines and screen readers read it right.
  htmlAttrs: {
    lang: () => getLocale()
  }
})

useSeoMeta({
  ogSiteName: 'Seene',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
