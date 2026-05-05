<script setup lang="ts">
const props = defineProps<{
  step: 1 | 2 | 3
  canProceed: boolean
}>()

const emit = defineEmits<{
  back: []
  next: []
}>()

const { $ts } = useI18n()

const actionLabel = computed(() =>
  props.step === 3 ? $ts('booking.header.confirm') : $ts('booking.header.next')
)

const progressLabel = computed(() =>
  $ts('booking.header.progressLabel', { step: props.step, total: 3 })
)
</script>

<template>
  <header
    class="sticky top-0 z-10 grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--ui-border-muted)] bg-[var(--ui-bg)]/95 px-4 py-3 backdrop-blur"
  >
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-arrow-left"
      :aria-label="$ts('booking.header.back')"
      @click="emit('back')"
    />

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
        class="h-1.5 min-w-0 flex-1 rounded-full transition-colors"
        :class="segment <= step ? 'bg-primary' : 'bg-[var(--ui-bg-muted)]'"
      />
    </div>

    <UButton
      v-if="canProceed"
      color="primary"
      variant="solid"
      size="sm"
      trailing-icon="i-lucide-arrow-right"
      :label="actionLabel"
      @click="emit('next')"
    />
    <div v-else class="h-8 w-8" aria-hidden="true" />
  </header>
</template>
