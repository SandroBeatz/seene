<script setup lang="ts">
import type { MasterService } from '#shared/types/master'
import type { VerifyResult } from './BookingVerifyDrawer.vue'

interface BookingResponse {
  booking: {
    id: string
    starts_at: string
    ends_at: string
    services: BookingService[]
    master: BookingMaster
  }
}

interface PhoneCheck {
  phone: string
  clientExists: boolean
  verified: boolean
  firstName?: string
}

const props = defineProps<{
  username: string
  services: Pick<MasterService, 'id' | 'name' | 'duration' | 'price'>[]
}>()

const emit = defineEmits<{
  changeTime: []
}>()

const { $ts, getLocale } = useI18n()
const bookingState = useBookingState(props.username)
const queryCache = useQueryCache()

const { data: masterData } = useMasterData(() => props.username)
const { formatPrice, formatTime } = useMasterFormat(() => masterData.value?.settings)

// --- Overview ---

const selectedServices = computed(() =>
  props.services.filter((s) => bookingState.value.selectedServiceIds.includes(s.id))
)
const totalDuration = computed(() => selectedServices.value.reduce((sum, s) => sum + s.duration, 0))
const totalPrice = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + priceToNumber(s.price), 0)
)

// "Tuesday, 6 October" + "11:00 – 12:00" reads faster than a numeric date.
const slotDay = computed(() => {
  const slot = bookingState.value.selectedSlot
  if (!slot) return ''
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(slot))
})

const slotTimeRange = computed(() => {
  const slot = bookingState.value.selectedSlot
  if (!slot) return ''
  const start = new Date(slot)
  const end = new Date(start.getTime() + totalDuration.value * 60_000)
  return `${formatTime(start)} – ${formatTime(end)}`
})

// --- Note ---

const showNoteDrawer = ref(false)
const noteInput = ref(bookingState.value.note)

function openNoteDrawer() {
  noteInput.value = bookingState.value.note
  showNoteDrawer.value = true
}

function saveNote() {
  bookingState.value.note = noteInput.value.trim()
  showNoteDrawer.value = false
}

// --- Phone lookup: runs as soon as the number is valid ---

const bookingLoading = ref(false)
const bookingError = ref<'' | 'slotUnavailable' | 'bookingFailed' | 'checkFailed'>('')

const phoneTouched = ref(false)
const phoneCheck = ref<PhoneCheck | null>(null)
const checking = ref(false)
let pendingCheck: Promise<PhoneCheck | null> | null = null

const currentCheck = computed(() =>
  phoneCheck.value?.phone === bookingState.value.phone ? phoneCheck.value : null
)
const phoneInvalid = computed(() => phoneTouched.value && !bookingState.value.phone)

function checkPhone(phone: string): Promise<PhoneCheck | null> {
  if (currentCheck.value) return Promise.resolve(currentCheck.value)

  checking.value = true
  const request = $fetch<Omit<PhoneCheck, 'phone'>>('/api/auth/phone/check', {
    query: { phone, username: props.username }
  })
    .then((result) => {
      // Ignore answers for a number that was edited meanwhile.
      if (bookingState.value.phone !== phone) return null
      phoneCheck.value = { phone, ...result }
      return phoneCheck.value
    })
    .catch(() => null)
    .finally(() => {
      if (pendingCheck === request) {
        pendingCheck = null
        checking.value = false
      }
    })

  pendingCheck = request
  return request
}

const savedPhone = useSavedPhone()

watch(
  () => bookingState.value.phone,
  (phone) => {
    bookingError.value = ''
    if (!phone) return
    // Remember every valid number on this device for the next booking.
    savedPhone.save(phone)
    checkPhone(phone)
  },
  { immediate: true }
)

// The cookie may be gone while localStorage still has the number.
onMounted(() => {
  if (!bookingState.value.phone) bookingState.value.phone = savedPhone.read()
})

// --- Submit ---

const showVerifyDrawer = ref(false)

const busy = computed(() => bookingLoading.value || (checking.value && phoneTouched.value))

async function submit() {
  phoneTouched.value = true
  bookingError.value = ''
  const phone = bookingState.value.phone
  if (!phone || bookingLoading.value) return

  const check = await (pendingCheck ?? checkPhone(phone))
  if (!check) {
    bookingError.value = 'checkFailed'
    return
  }

  if (check.clientExists && check.verified) {
    await createBooking()
  } else {
    showVerifyDrawer.value = true
  }
}

defineExpose({ submit, busy })

async function onVerified(result: VerifyResult) {
  await createBooking(result)
}

async function createBooking(details?: VerifyResult) {
  bookingLoading.value = true
  bookingError.value = ''

  try {
    const result = await $fetch<BookingResponse>(`/api/master/${props.username}/appointments`, {
      method: 'POST',
      body: {
        service_ids: bookingState.value.selectedServiceIds,
        starts_at: bookingState.value.selectedSlot,
        phone: bookingState.value.phone,
        ...(details?.firstName ? { first_name: details.firstName } : {}),
        ...(details?.otpToken ? { otp_token: details.otpToken } : {}),
        ...(bookingState.value.note ? { note: bookingState.value.note } : {})
      }
    })

    queryCache.invalidateQueries({ key: ['booking-availability', props.username] })
    showVerifyDrawer.value = false
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
    showVerifyDrawer.value = false

    if (statusCode === 409) {
      bookingError.value = 'slotUnavailable'
      queryCache.invalidateQueries({ key: ['booking-availability', props.username] })
    } else if (statusCode === 401 && phoneCheck.value) {
      // The phone is not confirmed after all — ask for the code.
      phoneCheck.value = { ...phoneCheck.value, verified: false }
      showVerifyDrawer.value = true
    } else {
      bookingError.value = 'bookingFailed'
    }
  } finally {
    bookingLoading.value = false
  }
}

const errorTitle = computed(() => {
  switch (bookingError.value) {
    case 'slotUnavailable':
      return $ts('booking.errors.slotUnavailable')
    case 'checkFailed':
      return $ts('booking.errors.checkFailed')
    default:
      return $ts('booking.errors.bookingFailed')
  }
})
</script>

<template>
  <section class="flex flex-col gap-6">
    <p class="text-xs text-muted">
      {{ $ts('booking.steps.confirm.description') }}
    </p>

    <!-- Booking overview -->
    <UCard variant="outline" :ui="{ root: 'rounded-xl shadow-none', body: 'p-4 sm:p-4' }">
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <UIcon name="i-lucide-calendar-check" class="size-5" />
          </div>
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="truncate text-sm font-semibold first-letter:uppercase text-highlighted">
              {{ slotDay }}
            </span>
            <span class="text-xs text-muted tabular-nums">
              {{ slotTimeRange }} ·
              {{ $ts('booking.service.duration', { duration: totalDuration }) }}
            </span>
          </div>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-pencil"
            :aria-label="$ts('booking.steps.confirm.changeTime')"
            class="ms-auto shrink-0"
            @click="emit('changeTime')"
          />
        </div>

        <USeparator />

        <ul class="flex flex-col gap-2">
          <li
            v-for="service in selectedServices"
            :key="service.id"
            class="flex items-baseline justify-between gap-3 text-sm"
          >
            <span class="text-highlighted">{{ service.name }}</span>
            <span class="shrink-0 text-muted">{{ formatPrice(service.price) }}</span>
          </li>
        </ul>

        <USeparator />

        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">{{ $ts('booking.steps.confirm.total') }}</span>
          <span class="text-lg font-semibold text-highlighted">{{ formatPrice(totalPrice) }}</span>
        </div>
      </div>
    </UCard>

    <!-- Phone -->
    <UFormField
      :label="$ts('booking.steps.confirm.phone')"
      :error="phoneInvalid ? $ts('booking.errors.phoneInvalid') : false"
      :ui="{ label: 'text-base font-semibold' }"
    >
      <BookingPhoneInput
        v-model="bookingState.phone"
        :default-country="masterData?.profile.country"
        :disabled="bookingLoading"
        :invalid="phoneInvalid"
        @submit="submit"
      />
    </UFormField>

    <!-- Phone lookup status -->
    <Transition name="fade" mode="out-in">
      <p
        v-if="bookingState.phone && checking && !currentCheck"
        key="checking"
        class="-mt-3 flex items-center gap-2 text-sm text-muted"
        role="status"
      >
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
        {{ $ts('booking.steps.confirm.checkingPhone') }}
      </p>
      <UAlert
        v-else-if="currentCheck?.clientExists"
        key="known"
        color="success"
        variant="subtle"
        :icon="currentCheck.verified ? 'i-lucide-badge-check' : 'i-lucide-message-square-text'"
        class="-mt-2"
        :title="
          currentCheck.firstName
            ? $ts('booking.steps.confirm.welcome', { name: currentCheck.firstName })
            : $ts('booking.steps.confirm.welcomeAnonymous')
        "
        :description="
          currentCheck.verified
            ? $ts('booking.steps.confirm.verifiedHint')
            : $ts('booking.steps.confirm.unverifiedHint')
        "
      />
      <UAlert
        v-else-if="currentCheck"
        key="new"
        color="neutral"
        variant="subtle"
        icon="i-lucide-sparkles"
        class="-mt-2"
        :title="$ts('booking.steps.confirm.newClientTitle')"
        :description="$ts('booking.steps.confirm.newClientHint')"
      />
    </Transition>

    <!-- Note -->
    <div v-if="bookingState.note" class="flex items-start gap-3 rounded-2xl bg-elevated p-4">
      <UIcon name="i-lucide-notebook-pen" class="mt-0.5 size-4 shrink-0 text-muted" />
      <p class="flex-1 text-sm text-default">{{ bookingState.note }}</p>
      <UButton
        size="sm"
        variant="ghost"
        color="neutral"
        icon="i-lucide-pencil"
        :aria-label="$ts('booking.steps.confirm.editNote')"
        @click="openNoteDrawer"
      />
    </div>
    <UButton
      v-else
      size="lg"
      variant="soft"
      color="neutral"
      icon="i-lucide-notebook-pen"
      :label="$ts('booking.steps.confirm.addNote')"
      class="self-start"
      @click="openNoteDrawer"
    />

    <UAlert
      v-if="bookingError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="errorTitle"
      :actions="
        bookingError === 'slotUnavailable'
          ? [
              {
                label: $ts('booking.steps.confirm.changeTime'),
                color: 'error',
                variant: 'solid',
                onClick: () => emit('changeTime')
              }
            ]
          : []
      "
    />

    <!-- Note drawer -->
    <UDrawer
      v-model:open="showNoteDrawer"
      :title="$ts('booking.steps.confirm.noteModalTitle')"
      :ui="{
        container: 'mx-auto w-full max-w-lg',
        footer: 'pb-[max(1rem,env(safe-area-inset-bottom))]'
      }"
    >
      <template #body>
        <UTextarea
          v-model="noteInput"
          :placeholder="$ts('booking.steps.confirm.notePlaceholder')"
          :rows="4"
          size="xl"
          autofocus
          class="w-full"
        />
      </template>
      <template #footer>
        <div class="flex w-full gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="xl"
            :label="$ts('booking.steps.confirm.cancel')"
            class="flex-1 justify-center"
            @click="showNoteDrawer = false"
          />
          <UButton
            color="primary"
            size="xl"
            :label="$ts('booking.steps.confirm.saveNote')"
            class="flex-1 justify-center"
            @click="saveNote"
          />
        </div>
      </template>
    </UDrawer>

    <BookingVerifyDrawer
      v-model:open="showVerifyDrawer"
      :phone="bookingState.phone"
      :needs-details="!currentCheck?.clientExists"
      :needs-code="!currentCheck?.verified"
      :submitting="bookingLoading"
      @done="onVerified"
    />
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
