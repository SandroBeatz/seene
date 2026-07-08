<script setup lang="ts">
const { $ts, $localePath } = useI18n()
const { data: doc, placeholderData } = useLegalDoc('terms')

const breadcrumbs = computed(() => [
  { label: $ts('nav.home'), to: $localePath('/') },
  { label: $ts('title') }
])
</script>

<template>
  <UPage :ui="{ root: 'py-6' }">
    <UContainer>
      <UBreadcrumb :items="breadcrumbs" class="mb-6" />
      <ContentRenderer v-if="doc" :value="doc" :data="placeholderData" class="max-w-3xl mx-auto" />
    </UContainer>
  </UPage>
</template>
