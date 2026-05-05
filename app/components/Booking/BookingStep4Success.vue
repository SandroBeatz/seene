<script setup lang="ts">
const { $ts } = useI18n()
</script>

<template>
  <BookingStepPlaceholder
    icon="i-lucide-circle-check"
    :title="$ts('booking.steps.success.title')"
    :description="$ts('booking.steps.success.description')"
  />
</template>
