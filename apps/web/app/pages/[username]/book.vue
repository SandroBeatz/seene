<script setup lang="ts">
// The old booking page. Booking now opens over the master page; keep old links
// working by sending them there with the booking open.
const route = useRoute()
const { $localePath } = useI18n()

await navigateTo(
  { path: $localePath(`/${route.params.username as string}`), query: { book: 'services' } },
  { replace: true, redirectCode: 301 }
)
</script>

<template>
  <div />
</template>
