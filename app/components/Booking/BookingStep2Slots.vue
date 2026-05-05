<script setup lang="ts">
const { $ts } = useI18n()
</script>

<template>
  <BookingStepPlaceholder
    icon="i-lucide-calendar-clock"
    :title="$ts('booking.steps.slots.title')"
    :description="$ts('booking.steps.slots.description')"
  />
</template>
