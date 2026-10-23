<script setup lang="ts">
export interface BookingSummary {
  /** First selected service name, with "+N" when more are selected. */
  title: string
  /** Total duration · total price. */
  details: string
  /** Chosen date and time, once a slot is picked. */
  when?: string
}

const props = defineProps<{
  step: 1 | 2 | 3 | 4
  canProceed: boolean
  nextLabel: string
  nextLoading?: boolean
  /** Recap of the current choice shown next to the Next button. */
  summary?: BookingSummary | null
}>()

const emit = defineEmits<{
  back: []
  next: []
}>()
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-lg flex-col bg-default">
    <BookingHeader v-if="props.step !== 4" :step="props.step" @back="emit('back')" />

    <div class="flex-1 px-4 pt-2" :class="props.step !== 4 ? 'pb-32' : 'pb-8'">
      <slot />
    </div>

    <!-- Bottom action bar: booking recap + thumb-reachable Next -->
    <div v-if="props.step !== 4" class="fixed inset-x-0 bottom-0 z-20">
      <div
        class="relative mx-auto flex max-w-lg flex-col border-t border-default bg-default/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <!-- Chosen date/time pinned onto the footer border, so the bar never grows -->
        <Transition name="summary">
          <UBadge
            v-if="props.summary?.when"
            :key="props.summary.when"
            color="primary"
            variant="solid"
            size="sm"
            icon="i-lucide-calendar-clock"
            :label="props.summary.when"
            class="absolute top-0 left-4 -translate-y-1/2 rounded-full px-2 shadow-sm"
          />
        </Transition>

        <div class="flex items-center justify-between gap-4">
          <div class="flex min-w-0 flex-col gap-0.5">
            <template v-if="props.summary">
              <p class="truncate text-sm font-medium text-highlighted">
                {{ props.summary.title }}
              </p>
              <p class="truncate text-xs text-muted">{{ props.summary.details }}</p>
            </template>
            <p v-else class="text-sm text-muted">
              {{ $ts('booking.footer.nothingSelected') }}
            </p>
          </div>

          <UButton
            color="primary"
            size="lg"
            trailing-icon="i-lucide-arrow-right"
            :label="props.nextLabel"
            :disabled="!props.canProceed"
            :loading="props.nextLoading"
            class="h-11 shrink-0 justify-center px-4"
            @click="emit('next')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-enter-active,
.summary-leave-active {
  transition: opacity 0.15s ease;
}

.summary-enter-from,
.summary-leave-to {
  opacity: 0;
}
</style>
