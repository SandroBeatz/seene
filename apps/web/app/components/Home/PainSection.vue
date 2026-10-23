<script setup lang="ts">
const { $ts } = useI18n()
</script>

<template>
  <UPageSection
    id="pain"
    :ui="{
      root: 'bg-primary text-white',
      container: 'relative py-14!',
      title: 'text-white',
      description: 'text-neutral-300'
    }"
    :title="$ts('pain.title')"
    :description="$ts('pain.description')"
    orientation="horizontal"
  >
    <img
      src="assets/img/pain-img.png"
      width="652"
      height="647"
      alt="Illustration"
      class="absolute bottom-0 right-0"
      loading="lazy"
    />
  </UPageSection>
</template>
