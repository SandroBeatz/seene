<script setup lang="ts">
import type { MasterService } from '#shared/types/master'

interface BookingResponse {
  booking: {
    id: string
    starts_at: string
    ends_at: string
    services: BookingService[]
    master: BookingMaster
  }
}

const props = defineProps<{
  username: string
  services: Pick<MasterService, 'id' | 'name' | 'duration' | 'price'>[]
}>()

defineExpose({ triggerConfirm })

const { $ts, getLocale } = useI18n()
const bookingState = useBookingState(props.username)

// --- Overview ---

const selectedServices = computed(() =>
  props.services.filter((s) => bookingState.value.selectedServiceIds.includes(s.id))
)

const totalDuration = computed(() => selectedServices.value.reduce((sum, s) => sum + s.duration, 0))

const totalPrice = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + parseFloat(s.price), 0)
)

function formatDateTime(slot: string | null) {
  if (!slot) return ''
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(slot))
}

// --- Note ---

const showNoteModal = ref(false)
const noteInput = ref(bookingState.value.note)

function openNoteModal() {
  noteInput.value = bookingState.value.note
  showNoteModal.value = true
}

function saveNote() {
  bookingState.value.note = noteInput.value
  showNoteModal.value = false
}

// --- Phone ---

const phoneInput = ref(bookingState.value.phone)
const clientFirstName = ref<string | null>(null)
const isNewClient = ref(false)
const firstNameInput = ref('')
const lastNameInput = ref('')
let checkPhoneDebounce: ReturnType<typeof setTimeout> | null = null

watch(phoneInput, (val) => {
  bookingState.value.phone = val
  clientFirstName.value = null
  isNewClient.value = false
  firstNameInput.value = ''
  lastNameInput.value = ''

  if (checkPhoneDebounce) clearTimeout(checkPhoneDebounce)

  const digits = val.replace(/\D/g, '')
  if (digits.length >= 10) {
    checkPhoneDebounce = setTimeout(() => checkPhone(digits), 800)
  }
})

async function checkPhone(phone: string) {
  try {
    const result = await $fetch<{ clientExists: boolean; firstName?: string }>(
      '/api/auth/phone/check',
      { query: { phone, username: props.username } }
    )
    isNewClient.value = !result.clientExists
    clientFirstName.value = result.clientExists ? (result.firstName ?? null) : null
  } catch {
    // greeting is optional — silent fail
  }
}

// --- OTP flow ---

const showOtpModal = ref(false)
const otpValue = ref<number[]>([])
const otpError = ref('')
const otpLoading = ref(false)
const resendCountdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

const bookingLoading = ref(false)
const bookingError = ref('')

const countdownDisplay = computed(() => {
  const s = resendCountdown.value
  return `0:${String(s).padStart(2, '0')}`
})

async function triggerConfirm() {
  otpError.value = ''
  otpValue.value = []
  bookingError.value = ''

  if (isNewClient.value && !firstNameInput.value.trim()) {
    bookingError.value = 'nameRequired'
    return
  }

  try {
    await $fetch('/api/auth/phone/send', {
      method: 'POST',
      body: { phone: bookingState.value.phone }
    })
    showOtpModal.value = true
    startCountdown()
  } catch {
    bookingError.value = 'sendFailed'
  }
}

function startCountdown() {
  resendCountdown.value = 59
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      clearInterval(countdownInterval!)
      countdownInterval = null
    }
  }, 1000)
}

async function resendCode() {
  if (resendCountdown.value > 0) return
  otpValue.value = []
  otpError.value = ''

  try {
    await $fetch('/api/auth/phone/send', {
      method: 'POST',
      body: { phone: bookingState.value.phone }
    })
    startCountdown()
  } catch {
    otpError.value = 'sendFailed'
  }
}

async function onOtpComplete(value: number[]) {
  if (otpLoading.value) return
  otpLoading.value = true
  otpError.value = ''

  const code = value.join('')

  try {
    const result = await $fetch<{ success: boolean; token?: string; error?: string }>(
      '/api/auth/phone/verify',
      {
        method: 'POST',
        body: { phone: bookingState.value.phone, code }
      }
    )

    if (result.success && result.token) {
      bookingState.value.otpToken = result.token
      showOtpModal.value = false
      await createBooking()
    } else {
      otpError.value = result.error ?? 'invalid_code'
      otpValue.value = []
    }
  } catch {
    otpError.value = 'invalid_code'
    otpValue.value = []
  } finally {
    otpLoading.value = false
  }
}

async function createBooking() {
  bookingLoading.value = true
  bookingError.value = ''

  try {
    const result = await $fetch<BookingResponse>(`/api/master/${props.username}/appointments`, {
      method: 'POST',
      body: {
        service_ids: bookingState.value.selectedServiceIds,
        starts_at: bookingState.value.selectedSlot,
        phone: bookingState.value.phone,
        ...(isNewClient.value
          ? {
              first_name: firstNameInput.value.trim(),
              last_name: lastNameInput.value.trim() || undefined
            }
          : {}),
        ...(bookingState.value.note ? { note: bookingState.value.note } : {}),
        otp_token: bookingState.value.otpToken
      }
    })

    bookingState.value.booking = {
      id: result.booking.id,
      startsAt: result.booking.starts_at,
      endsAt: result.booking.ends_at,
      services: result.booking.services,
      master: result.booking.master
    }
    bookingState.value.step = 4
  } catch (e: unknown) {
    const statusCode = (e as { statusCode?: number }).statusCode
    if (statusCode === 409) {
      bookingError.value = 'slotUnavailable'
    } else if (statusCode === 400) {
      bookingError.value = 'nameRequired'
    } else {
      bookingError.value = 'bookingFailed'
    }
  } finally {
    bookingLoading.value = false
  }
}

function otpErrorMessage(code: string) {
  switch (code) {
    case 'invalid_code':
      return $ts('booking.sms.invalidCode')
    case 'expired_code':
      return $ts('booking.sms.expiredCode')
    case 'too_many_attempts':
      return $ts('booking.sms.tooManyAttempts')
    default:
      return $ts('booking.sms.sendFailed')
  }
}

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
  if (checkPhoneDebounce) clearTimeout(checkPhoneDebounce)
})
</script>

<template>
  <section class="flex flex-col gap-6">
    <!-- Section title -->
    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-semibold text-(--ui-text-highlighted)">
        {{ $ts('booking.steps.confirm.title') }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ $ts('booking.steps.confirm.description') }}
      </p>
    </div>

    <!-- Booking overview card -->
    <UCard variant="outline" :ui="{ body: 'p-4 sm:p-4' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <span
            v-for="service in selectedServices"
            :key="service.id"
            class="text-sm font-medium text-(--ui-text-highlighted)"
          >
            {{ service.name }}
          </span>
        </div>

        <USeparator />

        <div class="flex items-center gap-2 text-sm">
          <UIcon name="i-lucide-calendar" class="size-4 shrink-0 text-(--ui-text-muted)" />
          <span class="capitalize text-(--ui-text)">
            {{ formatDateTime(bookingState.selectedSlot) }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-sm">
          <UIcon name="i-lucide-clock" class="size-4 shrink-0 text-(--ui-text-muted)" />
          <span class="text-(--ui-text)">
            {{ $ts('booking.service.duration', { duration: totalDuration }) }}
          </span>
        </div>

        <USeparator />

        <div class="flex items-center justify-between">
          <span class="text-sm text-(--ui-text-muted)">
            {{ $ts('booking.steps.confirm.total') }}
          </span>
          <span class="font-semibold text-primary">
            {{ $ts('booking.service.price', { price: totalPrice }) }}
          </span>
        </div>
      </div>
    </UCard>

    <!-- Note section -->
    <div class="flex flex-col gap-2">
      <div
        v-if="bookingState.note"
        class="rounded-lg border border-(--ui-border-muted) bg-(--ui-bg-muted) p-3"
      >
        <p class="text-sm text-(--ui-text)">{{ bookingState.note }}</p>
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-pencil"
          :label="$ts('booking.steps.confirm.editNote')"
          class="mt-2 -ml-1"
          @click="openNoteModal"
        />
      </div>
      <UButton
        v-else
        size="sm"
        variant="ghost"
        color="neutral"
        icon="i-lucide-notebook-pen"
        :label="$ts('booking.steps.confirm.addNote')"
        class="-ml-2 self-start"
        @click="openNoteModal"
      />
    </div>

    <!-- Phone input -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-(--ui-text-highlighted)">
        {{ $ts('booking.steps.confirm.phone') }}
      </label>

      <Transition name="fade">
        <p v-if="clientFirstName" class="text-sm font-medium text-primary">
          {{ $ts('booking.steps.confirm.welcome', { name: clientFirstName }) }}
        </p>
      </Transition>

      <UInput
        v-model="phoneInput"
        type="tel"
        :placeholder="$ts('booking.steps.confirm.phonePlaceholder')"
        size="lg"
        icon="i-lucide-phone"
        autocomplete="tel"
      />

      <Transition name="fade">
        <div v-if="isNewClient" class="flex flex-col gap-3">
          <p class="text-sm text-(--ui-text-muted)">
            {{ $ts('booking.steps.confirm.newClientHint') }}
          </p>
          <UInput
            v-model="firstNameInput"
            :placeholder="$ts('booking.steps.confirm.firstName')"
            size="lg"
            icon="i-lucide-user"
            autocomplete="given-name"
          />
          <UInput
            v-model="lastNameInput"
            :placeholder="$ts('booking.steps.confirm.lastName')"
            size="lg"
            icon="i-lucide-user"
            autocomplete="family-name"
          />
        </div>
      </Transition>
    </div>

    <!-- Booking error -->
    <UAlert
      v-if="bookingError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="
        bookingError === 'slotUnavailable'
          ? $ts('booking.errors.slotUnavailable')
          : bookingError === 'nameRequired'
            ? $ts('booking.errors.nameRequired')
            : $ts('booking.errors.bookingFailed')
      "
    />

    <!-- Booking loading -->
    <div
      v-if="bookingLoading"
      class="flex items-center justify-center gap-2 py-2 text-sm text-(--ui-text-muted)"
    >
      <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
      <span>{{ $ts('booking.steps.confirm.creatingBooking') }}</span>
    </div>

    <!-- Note modal -->
    <UModal v-model:open="showNoteModal" :title="$ts('booking.steps.confirm.noteModalTitle')">
      <template #body>
        <div class="flex flex-col gap-4">
          <UTextarea
            v-model="noteInput"
            :placeholder="$ts('booking.steps.confirm.notePlaceholder')"
            :rows="4"
            autofocus
          />
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :label="$ts('booking.steps.confirm.cancel')"
              @click="showNoteModal = false"
            />
            <UButton
              color="primary"
              :label="$ts('booking.steps.confirm.saveNote')"
              @click="saveNote"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- OTP modal -->
    <UModal
      v-model:open="showOtpModal"
      :title="$ts('booking.sms.title')"
      :description="$ts('booking.sms.codeSentTo', { phone: phoneInput })"
      :dismissible="!otpLoading"
    >
      <template #body>
        <div class="flex flex-col items-center gap-5 py-2">
          <UPinInput
            v-model="otpValue"
            :length="4"
            type="number"
            size="xl"
            :disabled="otpLoading"
            otp
            @complete="onOtpComplete"
          />

          <UAlert
            v-if="otpError"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-alert"
            :title="otpErrorMessage(otpError)"
          />

          <div class="text-sm text-(--ui-text-muted)">
            <span v-if="resendCountdown > 0">
              {{ $ts('booking.sms.resendIn', { countdown: countdownDisplay }) }}
            </span>
            <UButton
              v-else
              size="sm"
              variant="ghost"
              color="neutral"
              :label="$ts('booking.sms.resend')"
              @click="resendCode"
            />
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
