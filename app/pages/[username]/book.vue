<script setup lang="ts">
definePageMeta({ layout: 'booking' })

const route = useRoute()
const { $localePath } = useI18n()

const username = computed(() => route.params.username as string)
const bookingState = useBookingState(username.value)

const step = computed(() => bookingState.value.step)
const canProceed = computed(() => {
  switch (bookingState.value.step) {
    case 1:
      return bookingState.value.selectedServiceIds.length > 0
    case 2:
      return Boolean(bookingState.value.selectedDate && bookingState.value.selectedSlot)
    case 3:
      return Boolean(bookingState.value.phone && bookingState.value.otpToken)
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

  bookingState.value.step = (bookingState.value.step + 1) as 1 | 2 | 3 | 4
}
</script>

<template>
  <BookingShell :step="step" :can-proceed="canProceed" @back="goBack" @next="goNext">
    <BookingStep1Services v-if="step === 1" />
    <BookingStep2Slots v-else-if="step === 2" />
    <BookingStep3Confirm v-else-if="step === 3" />
    <BookingStep4Success v-else />
  </BookingShell>
</template>
