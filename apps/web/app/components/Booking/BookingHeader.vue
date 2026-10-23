<script setup lang="ts">
const props = defineProps<{
  step: 1 | 2 | 3
}>()

const emit = defineEmits<{
  back: []
}>()

const { $ts } = useI18n()

const stepTitle = computed(
  () =>
    [
      $ts('booking.steps.services.title'),
      $ts('booking.steps.slots.title'),
      $ts('booking.steps.confirm.title')
    ][props.step - 1]
)

const progressLabel = computed(() =>
  $ts('booking.header.progressLabel', { step: props.step, total: 3 })
)
</script>

<template>
  <header class="sticky top-0 z-10 flex flex-col gap-3 bg-default/95 px-4 pb-3 pt-3 backdrop-blur">
    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <UButton
        color="neutral"
        variant="ghost"
        size="lg"
        icon="i-lucide-arrow-left"
        :aria-label="$ts('booking.header.back')"
        @click="emit('back')"
      />
      <h1 class="truncate text-center text-base font-semibold text-highlighted">{{ stepTitle }}</h1>
      <span class="w-10 text-end text-xs tabular-nums text-muted">{{ step }}/3</span>
    </div>

    <div
      class="flex items-center gap-1.5"
      role="progressbar"
      :aria-label="progressLabel"
      :aria-valuenow="step"
      aria-valuemin="1"
      aria-valuemax="3"
    >
      <div
        v-for="segment in 3"
        :key="segment"
        class="h-1 min-w-0 flex-1 rounded-full transition-colors duration-300"
        :class="segment <= step ? 'bg-inverted' : 'bg-accented'"
      />
    </div>
  </header>
</template>
