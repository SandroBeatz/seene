<script setup lang="ts">
const { $ts } = useI18n()
</script>

<template>
  <BookingStepPlaceholder
    icon="i-lucide-list-checks"
    :title="$ts('booking.steps.services.title')"
    :description="$ts('booking.steps.services.description')"
  />
</template>
