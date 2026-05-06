<script setup lang="ts">
import type { MasterPageData } from '#shared/types/master'

definePageMeta({ layout: 'booking' })

const route = useRoute()
const { $localePath } = useI18n()

const username = computed(() => route.params.username as string)
const bookingState = useBookingState(username.value)

const step3Ref = ref<{ triggerConfirm: () => void } | null>(null)

const { data, status, error } = useQuery({
  key: () => ['master', username.value],
  query: () => $fetch<MasterPageData>(`/api/master/${username.value}`)
})

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
    bookingState.value = {
      step: 1,
      selectedServiceIds: [],
      selectedDate: null,
      selectedSlot: null,
      note: '',
      phone: '',
      otpToken: '',
      booking: null
    }
  }
})

const step = computed(() => bookingState.value.step)
const canProceed = computed(() => {
  switch (bookingState.value.step) {
    case 1:
      return bookingState.value.selectedServiceIds.length > 0
    case 2:
      return Boolean(bookingState.value.selectedDate && bookingState.value.selectedSlot)
    case 3:
      return bookingState.value.phone.replace(/\D/g, '').length >= 10
    default:
      return false
  }
})

function goBack() {
  if (bookingState.value.step === 1) {
    return navigateTo($localePath(`/${username.value}`))
  }

  bookingState.value.step = (bookingState.value.step - 1) as 1 | 2 | 3 | 4
}
function goNext() {
  if (!canProceed.value || bookingState.value.step === 4) {
    return
  }

  if (bookingState.value.step === 3) {
    step3Ref.value?.triggerConfirm()
    return
  }

  bookingState.value.step = (bookingState.value.step + 1) as 1 | 2 | 3 | 4
}
</script>

<template>
  <BookingShell :step="step" :can-proceed="canProceed" @back="goBack" @next="goNext">
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
    />
    <BookingStep4Success v-else :username="username" :profile="data?.profile" />
  </BookingShell>
</template>
