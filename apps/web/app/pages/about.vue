<script setup lang="ts">
const { $ts, $localePath } = useI18n()

const breadcrumbs = computed(() => [
  { label: $ts('nav.home'), to: $localePath('/') },
  { label: $ts('title') }
])
</script>

<template>
  <UPage :ui="{ root: 'py-6' }">
    <UContainer>
      <UBreadcrumb :items="breadcrumbs" class="mb-6" />
      <UPageHeader :title="$ts('title')" />
      <p class="text-muted">
        {{ $ts('placeholder') }}
      </p>
    </UContainer>
  </UPage>
</template>
