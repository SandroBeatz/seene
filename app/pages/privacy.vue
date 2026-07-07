<script setup lang="ts">
const { $ts, $localePath } = useI18n()
const { data: doc, placeholderData } = useLegalDoc('privacy')

const breadcrumbs = computed(() => [
  { label: $ts('nav.home'), to: $localePath('/') },
  { label: $ts('title') }
])
</script>

<template>
  <UPage>
    <UPageHero :title="$ts('title')" orientation="vertical" />
    <UPageSection>
      <UBreadcrumb :items="breadcrumbs" class="mb-6" />
      <ContentRenderer v-if="doc" :value="doc" :data="placeholderData" class="max-w-3xl mx-auto" />
    </UPageSection>
  </UPage>
</template>
