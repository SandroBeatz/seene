<script setup lang="ts">
import { DialogDescription, DialogTitle } from 'reka-ui'
import type { MasterPageData } from '#shared/types/master'

const props = defineProps<{
  data: MasterPageData
  bookingEnabled: boolean
}>()

const { $ts, $localePath, getLocale } = useI18n()
const username = computed(() => props.data.profile.username)
const bookingState = useBookingState(username.value)
const { step, stepNumber, goTo, replace, back, close } = useBookingFlow(username)
const { formatPrice, formatTime } = useMasterFormat(
  () => props.data.settings,
  () => props.data.timezone
)

const services = computed(() => props.data.services.filter((s) => s.show_online))
const service = computed(() =>
  services.value.find((s) => s.id === bookingState.value.selectedServiceIds[0])
)

const step3Ref = useTemplateRef<{ submit: () => Promise<void>; busy: boolean }>('step3')
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
    if (current !== 'services' && current !== 'done' && !service.value) return replace('services')
    if (current === 'details' && !state.selectedSlot) return replace('time')
  },
  { immediate: true }
)

// Leaving "Done" starts the next booking from scratch, keeping the phone.
watch(step, (current, previous) => {
  if (previous === 'done' && current !== 'done') {
    bookingState.value = createBookingState({ phone: bookingState.value.phone })
  }
  if (current !== 'time') slotTaken.value = false
})

const title = computed(() => {
  switch (step.value) {
    case 'services':
      return $ts('booking.steps.services.title')
    case 'time':
      return $ts('booking.steps.slots.title')
    case 'details':
      return $ts('booking.steps.confirm.title')
    default:
      return $ts('booking.steps.success.heading')
  }
})

const pickedTime = computed(() => {
  const slot = bookingState.value.selectedSlot
  if (!slot) return ''
  const day = new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: props.data.timezone
  }).format(new Date(slot))
  return `${day}, ${formatTime(slot)}`
})

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
  <UModal
    v-model:open="open"
    fullscreen
    :close="false"
    :ui="{
      content: 'divide-y-0',
      header: 'mx-auto w-full max-w-lg flex-col items-stretch gap-3 px-4 pt-3 pb-3 sm:px-4',
      body: 'mx-auto w-full max-w-lg px-4 pt-1 pb-6 sm:px-4 sm:pt-1',
      footer:
        'mx-auto w-full max-w-lg flex-col items-stretch gap-2 border-t border-default px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4'
    }"
  >
    <template #header>
      <div class="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
        <UButton
          v-if="step !== 'done'"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          :aria-label="$ts('booking.header.back')"
          @click="back"
        />
        <span v-else />
        <div class="flex min-w-0 flex-col items-center text-center">
          <DialogTitle class="truncate text-base font-semibold text-highlighted">
            {{ title }}
          </DialogTitle>
          <DialogDescription v-if="step !== 'done'" class="text-xs text-muted tabular-nums">
            {{ $ts('booking.header.progressLabel', { step: stepNumber, total: 3 }) }}
          </DialogDescription>
          <DialogDescription v-else class="sr-only">{{ title }}</DialogDescription>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          :aria-label="$ts('booking.header.close')"
          @click="close"
        />
      </div>

      <div v-if="step !== 'done'" class="flex items-center gap-1.5" aria-hidden="true">
        <div
          v-for="segment in 3"
          :key="segment"
          class="h-1 min-w-0 flex-1 rounded-full transition-colors duration-300"
          :class="segment <= stepNumber ? 'bg-primary' : 'bg-accented'"
        />
      </div>
    </template>

    <template #body>
      <BookingStep1Services
        v-if="step === 'services'"
        :username="username"
        :categories="data.categories"
        :services="services"
        @select="goTo('time')"
      />
      <BookingStep2Slots
        v-else-if="step === 'time' && service"
        :username="username"
        :slot-taken="slotTaken"
      />
      <BookingStep3Confirm
        v-else-if="step === 'details' && service && bookingState.selectedSlot"
        ref="step3"
        :username="username"
        :services="services"
        @change-time="back"
        @slot-taken="onSlotTaken"
        @booked="onBooked"
      />
      <BookingStep4Success v-else-if="step === 'done'" :username="username" :data="data" />
    </template>

    <template v-if="step !== 'services'" #footer>
      <div v-if="step === 'time'" class="flex items-center justify-between gap-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <p class="truncate text-sm font-medium text-highlighted">{{ service?.name }}</p>
          <p class="truncate text-xs text-muted">
            {{
              pickedTime ||
              [
                $ts('booking.service.duration', { duration: service?.duration ?? 0 }),
                service ? formatPrice(service.price) : ''
              ].join(' · ')
            }}
          </p>
        </div>
        <UButton
          size="lg"
          trailing-icon="i-lucide-arrow-right"
          :label="$ts('booking.header.next')"
          :disabled="!bookingState.selectedSlot"
          class="h-11 shrink-0 rounded-[14px] px-4"
          @click="goTo('details')"
        />
      </div>

      <template v-else-if="step === 'details'">
        <UButton
          size="xl"
          block
          :label="$ts('booking.footer.book')"
          :loading="Boolean(step3Ref?.busy)"
          class="rounded-[16px] py-3.5 text-base font-semibold"
          @click="step3Ref?.submit()"
        />
        <i18n-t
          keypath="booking.footer.policy"
          tag="p"
          class="text-center text-xs text-muted"
        >
          <template #link>
            <ULink :to="$localePath('/privacy')" target="_blank" class="underline">
              {{ $ts('booking.footer.policyLink') }}
            </ULink>
          </template>
        </i18n-t>
      </template>

      <UButton
        v-else
        size="xl"
        block
        :label="$ts('booking.steps.success.done')"
        class="rounded-[16px] py-3.5 text-base font-semibold"
        @click="close"
      />
    </template>
  </UModal>
</template>
