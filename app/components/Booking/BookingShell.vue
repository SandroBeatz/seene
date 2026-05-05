<script setup lang="ts">
const props = defineProps<{
  step: 1 | 2 | 3 | 4
  canProceed: boolean
}>()

const emit = defineEmits<{
  back: []
  next: []
}>()
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-lg flex-col bg-[var(--ui-bg)]">
    <BookingHeader
      v-if="props.step !== 4"
      :step="props.step"
      :can-proceed="props.canProceed"
      @back="emit('back')"
      @next="emit('next')"
    />

    <div class="flex-1 overflow-y-auto px-4 pb-8 pt-4">
      <slot />
    </div>
  </div>
</template>
