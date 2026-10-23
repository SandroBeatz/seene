<script setup lang="ts">
defineProps<{
  service: { name: string; photo_url: string | null }
}>()
</script>

<template>
  <img
    v-if="service.photo_url"
    :src="service.photo_url"
    alt=""
    loading="lazy"
    decoding="async"
    class="shrink-0 object-cover"
  />
  <span
    v-else
    class="flex shrink-0 items-center justify-center bg-(--seene-accent-soft) font-display font-bold text-(--seene-accent-text)"
    aria-hidden="true"
  >
    {{ service.name.charAt(0).toUpperCase() }}
  </span>
</template>
