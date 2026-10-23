<script setup lang="ts">
const { $ts } = useI18n()

const personalFeatures = computed(() => [
  {
    title: $ts('personalPage.features.avatar'),
    icon: 'i-lucide-circle-user-round'
  },
  {
    title: $ts('personalPage.features.services'),
    icon: 'i-lucide-list-checks'
  },
  {
    title: $ts('personalPage.features.booking'),
    icon: 'i-lucide-calendar-check-2'
  },
  {
    title: $ts('personalPage.features.contacts'),
    icon: 'i-lucide-phone'
  }
])
</script>

<template>
  <UPageSection
    id="profile"
    :title="$ts('personalPage.title')"
    :description="$ts('personalPage.description')"
    :features="personalFeatures"
    orientation="horizontal"
    :ui="{ root: 'bg-muted', container: 'relative' }"
  >
    <img
      src="assets/img/personal-img.png"
      width="852"
      height="947"
      alt="Illustration"
      class="absolute bottom-0 right-0"
      loading="lazy"
    />
  </UPageSection>
</template>
