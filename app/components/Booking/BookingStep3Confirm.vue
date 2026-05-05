<script setup lang="ts">
const { $ts } = useI18n()
</script>

<template>
  <BookingStepPlaceholder
    icon="i-lucide-shield-check"
    :title="$ts('booking.steps.confirm.title')"
    :description="$ts('booking.steps.confirm.description')"
  />
</template>
