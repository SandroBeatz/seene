<script setup lang="ts">
import type { MasterPageData } from '#shared/types/master'

interface BookingResponse {
  booking: {
    id: string
    starts_at: string
    ends_at: string
    status: 'pending' | 'confirmed'
    services: BookingService[]
    master: BookingMaster
  }
}

/** Without this device's token every number gets the same answer: a code is needed. */
interface PhoneCheck {
  phone: string
  recognized: boolean
  firstName?: string
}

/**
 * phone   → number and code channel (a trusted browser jumps to `known`)
 * known   → this browser is trusted for the number: book without a code
 * otp     → the code
 * welcome → after the code: the master already has this number
 * first   → after the code: a new client, asks only the name
 */
type Screen = 'phone' | 'known' | 'otp' | 'welcome' | 'first'
type CodeChannel = 'whatsapp' | 'telegram'

const props = defineProps<{
  data: MasterPageData
}>()

const emit = defineEmits<{
  /** The held slot was taken by someone else: pick another time. */
  slotTaken: []
  booked: []
}>()

const { $ts, getLocale } = useI18n()
const username = computed(() => props.data.profile.username)
const bookingState = useBookingState(username.value)
const queryCache = useQueryCache()
const savedPhone = useSavedPhone()
const summary = useBookingSummary(() => props.data)
const { formatTime } = useMasterFormat(() => props.data.settings, () => props.data.timezone)

const screen = ref<Screen>('phone')
const error = ref('')

// --- Slot hold: nobody else can take her time while she fills this in ---

let holdTimer: ReturnType<typeof setTimeout> | null = null
let booked = false

async function holdSlot() {
  const startsAt = bookingState.value.selectedSlot
  if (!startsAt) return

  try {
    const { expires_at } = await $fetch<{ expires_at: string }>(
      `/api/master/${username.value}/hold`,
      {
        method: 'POST',
        body: { service_ids: bookingState.value.selectedServiceIds, starts_at: startsAt }
      }
    )
    // Renew shortly before it lapses, for as long as she stays on this step.
    if (holdTimer) clearTimeout(holdTimer)
    holdTimer = setTimeout(
      holdSlot,
      Math.max(new Date(expires_at).getTime() - Date.now() - 30_000, 30_000)
    )
  } catch (e: unknown) {
    if ((e as { statusCode?: number }).statusCode === 409) {
      queryCache.invalidateQueries({ key: ['booking-availability', username.value] })
      emit('slotTaken')
    }
    // Other failures: the booking re-checks the slot anyway.
  }
}

onMounted(() => {
  void holdSlot()
  // The phone screen shows at once; a remembered number is checked in the background.
  if (!bookingState.value.phone) bookingState.value.phone = savedPhone.read()
})

onBeforeUnmount(() => {
  if (holdTimer) clearTimeout(holdTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  if (checkTimer) clearTimeout(checkTimer)
  // Left without booking: let the time go for others right away.
  if (!booked) {
    $fetch(`/api/master/${username.value}/hold`, { method: 'DELETE' }).catch(() => {})
  }
})

// --- When: "Fri, 24 October, 11:30" ---

const whenShort = computed(() => {
  const slot = bookingState.value.selectedSlot
  if (!slot) return ''
  const day = new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    timeZone: props.data.timezone
  }).format(new Date(slot))
  return `${day}, ${formatTime(slot)}`
})

// --- Phone: checked as soon as it is a valid number ---

const phoneTouched = ref(false)
const check = ref<PhoneCheck | null>(null)
const checking = ref(false)
let checkTimer: ReturnType<typeof setTimeout> | null = null

const phoneStatus = computed(() => {
  const phone = bookingState.value.phone
  if (!phone) return null
  return checking.value || check.value?.phone !== phone ? 'checking' : 'ready'
})

async function checkPhone(phone: string): Promise<PhoneCheck | null> {
  if (check.value?.phone === phone) return check.value
  checking.value = true
  try {
    const result = await $fetch<Omit<PhoneCheck, 'phone'>>('/api/auth/phone/check', {
      query: { phone, username: username.value }
    })
    // An answer for a number that was edited meanwhile is stale.
    if (bookingState.value.phone !== phone) return null
    check.value = { phone, ...result }
    return check.value
  } catch {
    // Unknown is the safe answer: she just gets a code.
    if (bookingState.value.phone === phone) check.value = { phone, recognized: false }
    return check.value
  } finally {
    checking.value = false
  }
}

watch(
  () => bookingState.value.phone,
  (phone) => {
    error.value = ''
    if (checkTimer) clearTimeout(checkTimer)
    if (!phone) return
    savedPhone.save(phone)
    checkTimer = setTimeout(async () => {
      const result = await checkPhone(phone)
      // A trusted browser books without a code.
      if (result?.recognized && result.firstName && screen.value === 'phone') {
        screen.value = 'known'
      }
    }, 250)
  },
  { immediate: true }
)

const phoneDisplay = computed(() => formatPhone(bookingState.value.phone))

// "Not you?": this device stops being trusted for the master and forgets the number.
const forgetting = ref(false)

async function forgetDevice() {
  if (forgetting.value) return
  forgetting.value = true
  try {
    await $fetch('/api/auth/phone/forget', { method: 'POST', body: { username: username.value } })
  } catch {
    // The device token stays valid on the server; the form is cleared anyway.
  } finally {
    forgetting.value = false
  }
  savedPhone.clear()
  check.value = null
  phoneTouched.value = false
  bookingState.value.phone = ''
  screen.value = 'phone'
}

// --- Code ---

const channel = ref<CodeChannel>('whatsapp')
const CHANNELS: CodeChannel[] = ['whatsapp', 'telegram']
const otherChannel = computed<CodeChannel>(() =>
  channel.value === 'whatsapp' ? 'telegram' : 'whatsapp'
)

const sending = ref(false)
const devCode = ref('')
const resendIn = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

function startCountdown(seconds = 60) {
  resendIn.value = seconds
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    resendIn.value -= 1
    if (resendIn.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

const resendLabel = computed(() => {
  const m = Math.floor(resendIn.value / 60)
  const s = String(resendIn.value % 60).padStart(2, '0')
  return $ts('booking.code.resendIn', { time: `${m}:${s}` })
})

async function sendCode() {
  if (sending.value) return
  sending.value = true
  error.value = ''
  otp.value = []

  try {
    const result = await $fetch<{ code?: string }>('/api/auth/phone/send', {
      method: 'POST',
      body: { phone: bookingState.value.phone, channel: channel.value }
    })
    devCode.value = result.code ?? ''
    screen.value = 'otp'
    startCountdown()
  } catch (e: unknown) {
    const { statusCode, data } = e as {
      statusCode?: number
      data?: { data?: { retryAfterSeconds?: number } }
    }
    if (statusCode === 429) {
      error.value = $ts('booking.code.tooManyRequests')
      if (screen.value === 'otp') startCountdown(data?.data?.retryAfterSeconds)
    } else {
      error.value = $ts('booking.code.sendFailed')
    }
  } finally {
    sending.value = false
  }
}

function requestCode() {
  phoneTouched.value = true
  if (!bookingState.value.phone || phoneStatus.value === 'checking') return
  void sendCode()
}

function switchChannel() {
  channel.value = otherChannel.value
  void sendCode()
}

const otp = ref<number[]>([])
const verifying = ref(false)
const otpToken = ref('')
const knownName = ref('')

async function confirmCode() {
  if (verifying.value) return
  const code = otp.value.join('')
  if (code.length !== 4) {
    error.value = $ts('booking.code.enterCode')
    return
  }

  verifying.value = true
  error.value = ''
  try {
    const result = await $fetch<{
      success: boolean
      token?: string
      error?: string
      clientExists?: boolean
      firstName?: string
    }>('/api/auth/phone/verify', {
      method: 'POST',
      body: { phone: bookingState.value.phone, code, username: username.value }
    })

    if (result.success && result.token) {
      otpToken.value = result.token
      // Only now, with the code, may we say whether the master knows this number.
      if (result.clientExists && result.firstName) {
        knownName.value = result.firstName
        screen.value = 'welcome'
      } else {
        screen.value = 'first'
      }
    } else {
      error.value = codeError(result.error)
      otp.value = []
    }
  } catch {
    error.value = codeError('invalid_code')
    otp.value = []
  } finally {
    verifying.value = false
  }
}

function codeError(code?: string) {
  switch (code) {
    case 'expired_code':
      return $ts('booking.code.expired')
    case 'too_many_attempts':
      return $ts('booking.code.tooManyAttempts')
    default:
      return $ts('booking.code.invalid')
  }
}

// --- New client: only the name ---

const firstName = ref('')
const nameTouched = ref(false)

// --- Booking ---

const bookingLoading = ref(false)

async function createBooking() {
  if (bookingLoading.value) return
  if (screen.value === 'first') {
    nameTouched.value = true
    if (!firstName.value.trim()) return
  }

  bookingLoading.value = true
  error.value = ''

  try {
    const result = await $fetch<BookingResponse>(`/api/master/${username.value}/appointments`, {
      method: 'POST',
      body: {
        service_ids: bookingState.value.selectedServiceIds,
        starts_at: bookingState.value.selectedSlot,
        phone: bookingState.value.phone,
        ...(otpToken.value ? { otp_token: otpToken.value } : {}),
        ...(screen.value === 'first' ? { first_name: firstName.value.trim() } : {}),
        reminders_consent: bookingState.value.remindersConsent,
        marketing_consent: bookingState.value.marketingConsent
      }
    })

    booked = true
    queryCache.invalidateQueries({ key: ['booking-availability', username.value] })
    queryCache.invalidateQueries({ key: ['master', username.value, 'nearest'] })
    bookingState.value.booking = {
      id: result.booking.id,
      startsAt: result.booking.starts_at,
      endsAt: result.booking.ends_at,
      status: result.booking.status,
      services: result.booking.services,
      master: result.booking.master
    }
    emit('booked')
  } catch (e: unknown) {
    const { statusCode, data } = e as { statusCode?: number; data?: { data?: { code?: string } } }
    const code = data?.data?.code

    if (code === 'booking_limit') {
      error.value = $ts('booking.errors.limit')
    } else if (code === 'booking_refused') {
      error.value = $ts('booking.errors.refused')
    } else if (statusCode === 409) {
      queryCache.invalidateQueries({ key: ['booking-availability', username.value] })
      emit('slotTaken')
    } else if (statusCode === 401) {
      // The device or the code is no longer valid: confirm the number again.
      check.value = null
      otpToken.value = ''
      screen.value = 'phone'
    } else {
      error.value = $ts('booking.errors.bookingFailed')
    }
  } finally {
    bookingLoading.value = false
  }
}

// --- Footer and Back ---

const footer = computed(() => {
  switch (screen.value) {
    case 'phone':
      return {
        label: $ts('booking.code.get'),
        loading: sending.value,
        disabled: phoneStatus.value === 'checking',
        policy: false,
        action: requestCode
      }
    case 'otp':
      return {
        label: $ts('booking.code.confirm'),
        loading: verifying.value,
        disabled: false,
        policy: false,
        action: confirmCode
      }
    default:
      return {
        label: $ts('booking.footer.book'),
        loading: bookingLoading.value,
        disabled: false,
        policy: true,
        action: createBooking
      }
  }
})

/** Back inside this step; false when the sheet should go to the previous step. */
function back() {
  error.value = ''
  if (screen.value === 'otp' || screen.value === 'welcome' || screen.value === 'first') {
    screen.value = 'phone'
    return true
  }
  return false
}

defineExpose({ back })
</script>

<template>
  <section class="flex flex-1 flex-col">
    <!-- Phone and code channel -->
    <div v-if="screen === 'phone'" key="phone" class="seene-reveal flex flex-col gap-4.5 px-5 pt-2">
      <div class="flex flex-col gap-2">
        <h1 class="font-display text-[26px] font-bold tracking-[-0.03em] text-highlighted">
          {{ $ts('booking.steps.confirm.phoneTitle') }}
        </h1>
        <p class="text-[15px] leading-normal text-muted">
          {{ $ts('booking.steps.confirm.phoneHint') }}
        </p>
      </div>
      <div class="flex flex-col gap-2">
        <p class="text-[13px] font-semibold text-highlighted">
          {{ $ts('booking.steps.confirm.phone') }}
        </p>
        <BookingPhoneInput
          v-model="bookingState.phone"
          :default-country="data.profile.country"
          :invalid="phoneTouched && !bookingState.phone"
          :status="phoneStatus"
          @submit="requestCode"
        />
        <p v-if="phoneTouched && !bookingState.phone" class="text-[13px] text-error">
          {{ $ts('booking.errors.phoneInvalid') }}
        </p>
      </div>
      <div class="flex flex-col gap-2">
        <p id="booking-channel" class="text-[13px] font-semibold text-highlighted">
          {{ $ts('booking.code.channelTitle') }}
        </p>
        <div
          role="group"
          aria-labelledby="booking-channel"
          class="grid grid-cols-2 gap-1 rounded-[14px] bg-muted p-1"
        >
          <button
            v-for="item in CHANNELS"
            :key="item"
            type="button"
            :aria-pressed="channel === item"
            class="rounded-[10px] p-2.75 text-sm font-semibold text-highlighted transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            :class="channel === item ? 'bg-elevated shadow-sm' : ''"
            @click="channel = item"
          >
            {{ $ts(`booking.code.channels.${item}`) }}
          </button>
        </div>
      </div>
      <div
        class="flex items-start gap-2.5 rounded-[14px] bg-muted p-3.5 text-[13px] leading-normal text-muted"
      >
        <UIcon name="i-lucide-lock" class="mt-0.5 size-4 shrink-0" />
        <span>{{ $ts('booking.steps.confirm.privacyNote', { name: data.profile.first_name }) }}</span>
      </div>
    </div>

    <!-- Trusted browser, or after the code with a number the master knows -->
    <div
      v-else-if="screen === 'known' || screen === 'welcome'"
      :key="screen"
      class="seene-reveal flex flex-col gap-4.5 px-5 pt-2"
    >
      <div class="flex flex-col items-start gap-3.5">
        <span
          class="flex size-14 items-center justify-center rounded-full bg-(--seene-accent-soft) font-display text-[22px] font-bold text-(--seene-accent-text)"
          aria-hidden="true"
        >
          {{ (screen === 'known' ? check?.firstName : knownName)?.charAt(0).toUpperCase() }}
        </span>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.03em] text-highlighted">
          {{
            $ts('booking.steps.confirm.welcome', {
              name: (screen === 'known' ? check?.firstName : knownName) ?? ''
            })
          }}
        </h1>
        <div class="flex items-center gap-2.5 text-[15px] text-muted">
          {{ phoneDisplay }}
          <UButton
            v-if="screen === 'known'"
            variant="link"
            :label="$ts('booking.steps.confirm.notYou')"
            :loading="forgetting"
            class="p-0 text-sm font-semibold text-(--seene-accent-text) hover:text-(--seene-accent-text)"
            @click="forgetDevice"
          />
        </div>
      </div>
      <dl class="rounded-[18px] border border-default px-4 py-1 text-sm">
        <div class="flex justify-between gap-3 border-b border-default py-3">
          <dt class="text-muted">
            {{
              summary.services.value.length > 1
                ? $ts('booking.steps.confirm.services')
                : $ts('booking.steps.confirm.service')
            }}
          </dt>
          <dd class="text-end font-semibold text-highlighted">{{ summary.name.value }}</dd>
        </div>
        <div class="flex justify-between gap-3 border-b border-default py-3">
          <dt class="text-muted">{{ $ts('booking.steps.confirm.when') }}</dt>
          <dd class="font-semibold text-highlighted">{{ whenShort }}</dd>
        </div>
        <div class="flex justify-between gap-3 py-3">
          <dt class="text-muted">{{ $ts('booking.steps.confirm.price') }}</dt>
          <dd class="font-semibold text-highlighted">{{ summary.priceLabel.value }}</dd>
        </div>
      </dl>
      <p v-if="screen === 'known'" class="text-[13px] leading-normal text-muted">
        {{ $ts('booking.steps.confirm.knownHint') }}
      </p>
      <BookingReminderSwitch v-else v-model="bookingState.remindersConsent" />
    </div>

    <!-- After the code: a new client -->
    <div v-else-if="screen === 'first'" key="first" class="seene-reveal flex flex-col gap-4.5 px-5 pt-2">
      <div class="flex flex-col gap-2">
        <h1 class="font-display text-[26px] font-bold tracking-[-0.03em] text-highlighted">
          {{ $ts('booking.steps.confirm.firstTitle') }}
        </h1>
        <p class="text-[15px] leading-normal text-muted">
          {{ $ts('booking.steps.confirm.firstHint', { name: data.profile.first_name }) }}
        </p>
      </div>
      <div class="flex flex-col gap-2">
        <label for="booking-name" class="text-[13px] font-semibold text-highlighted">
          {{ $ts('booking.steps.confirm.firstName') }}
        </label>
        <UInput
          id="booking-name"
          v-model="firstName"
          autocomplete="given-name"
          autofocus
          variant="none"
          :placeholder="$ts('booking.steps.confirm.namePlaceholder')"
          :aria-invalid="nameTouched && !firstName.trim()"
          :ui="{
            root: 'w-full',
            base: [
              'rounded-[16px] border-2 bg-elevated px-3.5 py-3.5 text-[17px] font-medium text-highlighted md:text-[17px] focus:ring-4 focus:ring-(--seene-accent-soft)',
              nameTouched && !firstName.trim() ? 'border-error' : 'border-primary'
            ].join(' ')
          }"
          @keydown.enter.prevent="createBooking"
        />
        <p v-if="nameTouched && !firstName.trim()" class="text-[13px] text-error">
          {{ $ts('booking.errors.nameRequired') }}
        </p>
      </div>
      <BookingReminderSwitch v-model="bookingState.remindersConsent" />
      <UCheckbox
        v-model="bookingState.marketingConsent"
        :label="$ts('booking.steps.confirm.marketing', { name: data.profile.first_name })"
        :ui="{
          root: 'items-start gap-3',
          base: 'size-5.5 rounded-[7px]',
          label: 'text-sm leading-[1.45] font-normal text-highlighted'
        }"
      />
    </div>

    <!-- Code -->
    <div v-else key="otp" class="seene-reveal flex flex-col gap-5.5 px-5 pt-2">
      <div class="flex flex-col gap-2">
        <h1 class="font-display text-[26px] font-bold tracking-[-0.03em] text-highlighted">
          {{ $ts('booking.code.title') }}
        </h1>
        <p class="text-[15px] leading-normal text-muted">
          {{
            $ts('booking.code.sentTo', {
              channel: $ts(`booking.code.channels.${channel}`),
              phone: phoneDisplay
            })
          }}
        </p>
      </div>
      <UPinInput
        v-model="otp"
        :length="4"
        type="number"
        otp
        autofocus
        :aria-label="$ts('booking.code.aria')"
        :ui="{
          root: 'grid grid-cols-[repeat(4,64px)] gap-2.5',
          base: 'h-18 w-16 rounded-[16px] border-0 bg-muted font-display text-[30px] font-bold text-highlighted ring-0 focus:bg-elevated focus:ring-2 focus:ring-primary'
        }"
        @complete="confirmCode"
      />
      <p v-if="devCode" class="text-[13px] text-muted">
        {{ $ts('booking.code.devCode', { code: devCode }) }}
      </p>
      <div class="flex flex-col items-start gap-3 text-sm">
        <span v-if="resendIn > 0" class="text-muted">{{ resendLabel }}</span>
        <UButton
          v-else
          variant="link"
          :label="$ts('booking.code.resend')"
          :loading="sending"
          class="p-0 text-sm font-semibold text-(--seene-accent-text) hover:text-(--seene-accent-text)"
          @click="sendCode"
        />
        <UButton
          variant="link"
          :label="
            $ts('booking.code.otherChannel', {
              channel: $ts(`booking.code.channels.${otherChannel}`)
            })
          "
          :disabled="sending"
          class="p-0 text-sm font-semibold text-(--seene-accent-text) hover:text-(--seene-accent-text)"
          @click="switchChannel"
        />
        <UButton
          variant="link"
          :label="$ts('booking.code.changePhone')"
          class="p-0 text-sm font-semibold text-(--seene-accent-text) hover:text-(--seene-accent-text)"
          @click="back()"
        />
      </div>
    </div>

    <p
      v-if="error"
      class="mx-5 mt-4 rounded-[14px] bg-error/10 p-3.5 text-[13px] text-error"
      role="alert"
    >
      {{ error }}
    </p>

    <BookingFooter
      :label="footer.label"
      :loading="footer.loading"
      :disabled="footer.disabled"
      :policy="footer.policy"
      @click="footer.action()"
    />
  </section>
</template>
