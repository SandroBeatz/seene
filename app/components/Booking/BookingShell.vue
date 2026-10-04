<script setup lang="ts">
const props = defineProps<{
  step: 1 | 2 | 3 | 4
  canProceed: boolean
  nextLabel: string
  nextLoading?: boolean
  /** One-line recap of the current choice shown above the buttons. */
  summary?: string
}>()

const emit = defineEmits<{
  back: []
  next: []
}>()
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-lg flex-col bg-default">
    <BookingHeader v-if="props.step !== 4" :step="props.step" @back="emit('back')" />

    <div class="flex-1 px-4 pt-2" :class="props.step !== 4 ? 'pb-44' : 'pb-8'">
      <slot />
    </div>

    <!-- Bottom action bar: thumb-reachable Back / Next -->
    <div v-if="props.step !== 4" class="fixed inset-x-0 bottom-0 z-20">
      <div
        class="mx-auto flex max-w-lg flex-col gap-3 border-t border-default bg-default/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <Transition name="summary" mode="out-in">
          <p
            v-if="props.summary"
            :key="props.summary"
            class="truncate text-center text-sm text-muted"
          >
            {{ props.summary }}
          </p>
        </Transition>

        <div class="flex items-center justify-between gap-3">
          <UButton
            color="neutral"
            variant="outline"
            size="xl"
            icon="i-lucide-arrow-left"
            :label="$ts('booking.header.back')"
            :disabled="props.nextLoading"
            class="h-12 justify-center px-5"
            @click="emit('back')"
          />
          <UButton
            color="primary"
            size="xl"
            trailing-icon="i-lucide-arrow-right"
            :label="props.nextLabel"
            :disabled="!props.canProceed"
            :loading="props.nextLoading"
            class="h-12 justify-center px-5"
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
