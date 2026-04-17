<script setup lang="ts">
const { $t, $localePath } = useI18n()

const breadcrumbs = computed(() => [
  { label: $t('nav.home'), to: $localePath('/') },
  { label: $t('title') }
])
</script>

<template>
  <UPage>
    <UPageHero :title="$t('title')" orientation="vertical" />
    <UPageSection>
      <UBreadcrumb :items="breadcrumbs" class="mb-6" />
      <p class="text-(--ui-text-muted)">
        {{ $t('placeholder') }}
      </p>
    </UPageSection>
  </UPage>
</template>
