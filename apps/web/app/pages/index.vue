<script setup lang="ts">
const { $ts } = useI18n()

useSeoMeta({
  title: () => $ts('seo.title'),
  description: () => $ts('seo.description'),
  ogTitle: () => $ts('seo.title'),
  ogDescription: () => $ts('seo.description')
})
</script>

<template>
  <div>
    <HomeHero />
    <HomeAudience />
    <HomeMoney />
    <HomeFeatures />
    <HomeRecall />
    <HomeCommission />
    <HomeFounders />
    <HomeFaq />
    <HomeFinal />
  </div>
</template>
