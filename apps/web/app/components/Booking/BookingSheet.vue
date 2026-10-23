<script setup lang="ts">
import { DialogDescription, DialogTitle } from 'reka-ui'
import type { MasterPageData } from '#shared/types/master'

const props = defineProps<{
  data: MasterPageData
  bookingEnabled: boolean
}>()

const { $ts } = useI18n()
const username = computed(() => props.data.profile.username)
const bookingState = useBookingState(username.value)
const { step, stepNumber, goTo, replace, back, close } = useBookingFlow(username)

const profile = computed(() => props.data.profile)
const fullName = computed(() => `${profile.value.first_name} ${profile.value.last_name}`.trim())
const initials = computed(() =>
  `${profile.value.first_name[0] ?? ''}${profile.value.last_name[0] ?? ''}`.toUpperCase()
)

const step3Ref = useTemplateRef<{ back: () => boolean }>('step3')
const scrollRef = useTemplateRef<HTMLElement>('scroll')
const slotTaken = ref(false)

// The sheet is client-only: its state (choice, phone) lives in this browser.
const mounted = ref(false)
onMounted(() => (mounted.value = true))

const open = computed({
  get: () => mounted.value && step.value !== null,
  set: (value) => {
    if (!value) close()
  }
})

// A step the state cannot back (reload, shared link, booking turned off) falls
// back to the furthest step that still makes sense.
watch(
  [mounted, step, () => props.bookingEnabled],
  ([isMounted, current, enabled]) => {
    if (!isMounted || !current) return
    if (!enabled) return replace(null)

    const state = bookingState.value
    if (current === 'done' && !state.booking) return replace(null)
    if (current !== 'services' && current !== 'done' && !state.selectedServiceIds.length) {
      return replace('services')
    }
    if (current === 'details' && !state.selectedSlot) return replace('time')
  },
  { immediate: true }
)

watch(step, (current, previous) => {
  // Leaving "Done" starts the next booking from scratch, keeping the phone.
  if (previous === 'done' && current !== 'done') {
    bookingState.value = createBookingState({ phone: bookingState.value.phone })
  }
  if (current !== 'time') slotTaken.value = false
  nextTick(() => scrollRef.value?.scrollTo({ top: 0 }))
})

// Step 3 has screens of its own (phone, code…): Back walks those first.
function onBack() {
  if (step.value === 'details' && step3Ref.value?.back()) return
  back()
}

function onSlotTaken() {
  bookingState.value.selectedSlot = null
  slotTaken.value = true
  back()
}

function onBooked() {
  // "Done" replaces "Details": Back from it must not reopen the form.
  replace('done')
}
</script>

<template>
  <UModal v-model:open="open" fullscreen :close="false" :ui="{ content: 'bg-default' }">
    <template #content>
      <div ref="scroll" class="h-full overflow-y-auto overscroll-contain [scrollbar-width:none]">
        <div class="mx-auto flex min-h-full max-w-lg flex-col">
          <DialogTitle class="sr-only">{{ $ts('booking.title', { name: fullName }) }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ $ts('booking.header.progressLabel', { step: Math.min(stepNumber, 3), total: 3 }) }}
          </DialogDescription>

          <header
            v-if="step !== 'done'"
            class="sticky top-0 z-10 flex flex-col gap-3 bg-default px-4 pt-3.5 pb-3"
          >
            <div class="flex items-center justify-between gap-2">
              <UButton
                color="neutral"
                variant="soft"
                icon="i-lucide-chevron-left"
                :aria-label="$ts('booking.header.back')"
                class="size-10 justify-center rounded-full bg-muted text-highlighted"
                @click="onBack"
              />
              <div class="flex min-w-0 items-center gap-2 text-sm font-semibold text-highlighted">
                <UAvatar
                  :src="profile.avatar_url ?? undefined"
                  :text="initials"
                  :alt="fullName"
                  class="size-6.5 bg-primary text-[10px]"
                  :ui="{ fallback: 'text-[10px] font-semibold text-inverted' }"
                />
                <span class="truncate">{{ fullName }}</span>
                <MasterVerifiedBadge v-if="profile.is_verified" :size="16" />
              </div>
              <UButton
                color="neutral"
                variant="soft"
                icon="i-lucide-x"
                :aria-label="$ts('booking.header.close')"
                class="size-10 justify-center rounded-full bg-muted text-highlighted"
                @click="close"
              />
            </div>
            <div class="flex flex-col gap-2">
              <div class="grid grid-cols-3 gap-1.5" aria-hidden="true">
                <span
                  v-for="segment in 3"
                  :key="segment"
                  class="h-1 rounded-full transition-colors duration-300"
                  :class="segment <= stepNumber ? 'bg-primary' : 'bg-accented'"
                />
              </div>
              <p class="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
                {{ $ts('booking.header.progressLabel', { step: stepNumber, total: 3 }) }}
              </p>
            </div>
          </header>

          <BookingStep1Services
            v-if="step === 'services'"
            :data="data"
            @next="goTo('time')"
          />
          <BookingStep2Slots
            v-else-if="step === 'time'"
            :data="data"
            :slot-taken="slotTaken"
            @change-services="goTo('services')"
            @next="goTo('details')"
          />
          <BookingStep3Details
            v-else-if="step === 'details' && bookingState.selectedSlot"
            ref="step3"
            :data="data"
            @slot-taken="onSlotTaken"
            @booked="onBooked"
          />
          <BookingStep4Success v-else-if="step === 'done'" :data="data" @close="close" />
        </div>
      </div>
    </template>
  </UModal>
</template>
