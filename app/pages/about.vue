<script setup lang="ts">
const { $ts, $localePath } = useI18n()

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
      <p class="text-muted">
        {{ $ts('placeholder') }}
      </p>
    </UPageSection>
  </UPage>
</template>
