<script setup lang="ts">
definePageMeta({ layout: 'booking', middleware: 'master-locale' })

const route = useRoute()
const { $ts, $localePath } = useI18n()

const username = computed(() => route.params.username as string)
const bookingState = useBookingState(username.value)

const step3Ref = ref<{ submit: () => Promise<void>; busy: boolean } | null>(null)

const { data, status, error } = useMasterData(username)
const { formatPrice, formatDateTime } = useMasterFormat(() => data.value?.settings)

watch(
  error,
  (err) => {
    if (err && (err as { statusCode?: number }).statusCode === 404) {
      throw createError({ statusCode: 404, fatal: true })
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (bookingState.value.step === 4) {
    bookingState.value = createBookingState({ phone: bookingState.value.phone })
  }
})

// Warm the slots cache while services are being picked, so the next step opens
// with the calendar already filled. Debounced to skip quick toggling.
const prefetchServiceIds = ref<string[]>([])
let prefetchTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => [bookingState.value.step, bookingState.value.selectedServiceIds] as const,
  ([currentStep, ids]) => {
    if (prefetchTimer) clearTimeout(prefetchTimer)
    if (currentStep !== 1) return
    prefetchTimer = setTimeout(() => (prefetchServiceIds.value = [...ids]), 400)
  },
  { immediate: true }
)

useBookingAvailability(
  username,
  prefetchServiceIds,
  () => import.meta.client && bookingState.value.step === 1
)

onUnmounted(() => {
  if (prefetchTimer) clearTimeout(prefetchTimer)
})

const step = computed(() => bookingState.value.step)

const canProceed = computed(() => {
  switch (bookingState.value.step) {
    case 1:
      return bookingState.value.selectedServiceIds.length > 0
    case 2:
      return Boolean(bookingState.value.selectedDate && bookingState.value.selectedSlot)
    case 3:
      // Always tappable: submit explains what is missing.
      return true
    default:
      return false
  }
})

const nextLabel = computed(() =>
  bookingState.value.step === 3 ? $ts('booking.footer.book') : $ts('booking.header.next')
)

const summary = computed(() => {
  const state = bookingState.value
  const selected = (data.value?.services ?? []).filter((s) =>
    state.selectedServiceIds.includes(s.id)
  )
  if (!selected.length) return ''

  if (state.step === 2 && state.selectedSlot) {
    return formatDateTime(state.selectedSlot)
  }

  if (state.step !== 1) return ''

  const duration = selected.reduce((sum, s) => sum + s.duration, 0)
  const price = selected.reduce((sum, s) => sum + priceToNumber(s.price), 0)
  return [
    $ts('booking.footer.servicesCount', { count: selected.length }),
    $ts('booking.service.duration', { duration }),
    formatPrice(price)
  ].join(' · ')
})

function scrollTop() {
  if (import.meta.client) window.scrollTo({ top: 0 })
}

function goBack() {
  if (bookingState.value.step === 1) {
    return navigateTo($localePath(`/${username.value}`))
  }

  bookingState.value.step = (bookingState.value.step - 1) as 1 | 2 | 3 | 4
  scrollTop()
}

function goToSlots() {
  bookingState.value.step = 2
  scrollTop()
}

function goNext() {
  if (!canProceed.value || bookingState.value.step === 4) {
    return
  }

  if (bookingState.value.step === 3) {
    step3Ref.value?.submit()
    return
  }

  bookingState.value.step = (bookingState.value.step + 1) as 1 | 2 | 3 | 4
  scrollTop()
}
</script>

<template>
  <div
    v-if="data && !data.settings.online_booking_enabled"
    class="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 bg-default px-4 text-center"
  >
    <UIcon name="i-lucide-calendar-x" class="size-16 text-muted" />
    <div class="flex flex-col gap-2">
      <p class="text-lg font-semibold">{{ $ts('booking.disabled.title') }}</p>
      <p class="text-muted">{{ $ts('booking.disabled.description') }}</p>
    </div>
    <UButton
      :to="$localePath(`/${username}`)"
      :label="$ts('booking.disabled.backToProfile')"
      variant="outline"
      size="xl"
    />
  </div>

  <BookingShell
    v-else
    :step="step"
    :can-proceed="canProceed"
    :next-label="nextLabel"
    :next-loading="step === 3 && Boolean(step3Ref?.busy)"
    :summary="summary"
    @back="goBack"
    @next="goNext"
  >
    <BookingStep1Services
      v-if="step === 1"
      :username="username"
      :categories="data?.categories ?? []"
      :services="data?.services ?? []"
      :loading="status === 'pending'"
    />
    <BookingStep2Slots v-else-if="step === 2" :username="username" />
    <BookingStep3Confirm
      v-else-if="step === 3"
      ref="step3Ref"
      :username="username"
      :services="data?.services ?? []"
      @change-time="goToSlots"
    />
    <BookingStep4Success v-else :username="username" :profile="data?.profile" />
  </BookingShell>
</template>
