<script setup lang="ts">
export interface VerifyResult {
  firstName: string
  otpToken: string
}

const props = defineProps<{
  /** Canonical phone being confirmed (digits only, e.g. '996555123456'). */
  phone: string
  /** New client: ask for a name first. */
  needsDetails: boolean
  /** Phone not confirmed yet: ask for a one-time code. */
  needsCode: boolean
  /** The booking itself is being created after this modal finished. */
  submitting: boolean
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  done: [result: VerifyResult]
}>()

const { $ts } = useI18n()

type Stage = 'details' | 'code'
type CodeChannel = 'whatsapp' | 'telegram'

const CHANNELS: { id: CodeChannel; icon: string; iconClass: string }[] = [
  { id: 'whatsapp', icon: 'i-simple-icons-whatsapp', iconClass: 'text-[#25D366]' },
  { id: 'telegram', icon: 'i-simple-icons-telegram', iconClass: 'text-[#26A5E4]' }
]

const stage = ref<Stage>('details')
const firstName = ref('')
const nameTouched = ref(false)
const otpToken = ref('')

const phoneDisplay = computed(() => formatPhone(props.phone))
const nameMissing = computed(() => !firstName.value.trim())

watch(open, (isOpen) => {
  if (!isOpen) {
    channelPickerOpen.value = false
    return
  }
  stage.value = props.needsDetails ? 'details' : 'code'
  nameTouched.value = false
  otpToken.value = ''
  channel.value = null
  devCode.value = ''
  otpError.value = ''
  otpValue.value = []
  // Known client with an unconfirmed number goes straight to the channel choice.
  if (stage.value === 'code') channelPickerOpen.value = true
})

// --- Details ---

function submitDetails() {
  nameTouched.value = true
  if (nameMissing.value) return

  if (props.needsCode) {
    channelPickerOpen.value = true
  } else {
    finish()
  }
}

// --- Channel choice (WhatsApp / Telegram) ---

const channelPickerOpen = ref(false)
const channel = ref<CodeChannel | null>(null)

const channelName = computed(() =>
  channel.value ? $ts(`booking.verify.channels.${channel.value}.name`) : ''
)

function chooseChannel(id: CodeChannel) {
  channel.value = id
  channelPickerOpen.value = false
  stage.value = 'code'
  resendCountdown.value = 0
  sendCode()
}

// The code step needs a channel: closing the picker without one steps back.
watch(channelPickerOpen, (isOpen) => {
  if (isOpen || channel.value || stage.value !== 'code') return
  if (props.needsDetails) stage.value = 'details'
  else open.value = false
})

// --- One-time code ---

const otpValue = ref<number[]>([])
const otpError = ref('')
const sending = ref(false)
const verifying = ref(false)
// DEV ONLY: code returned by the API until SMS delivery is wired.
const devCode = ref('')
const resendCountdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

async function sendCode() {
  if (sending.value || !channel.value) return
  sending.value = true
  otpError.value = ''
  otpValue.value = []

  try {
    const result = await $fetch<{ code?: string }>('/api/auth/phone/send', {
      method: 'POST',
      body: { phone: props.phone, channel: channel.value }
    })
    devCode.value = result.code ?? ''
    startCountdown()
  } catch {
    otpError.value = 'sendFailed'
  } finally {
    sending.value = false
  }
}

function startCountdown() {
  resendCountdown.value = 59
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }, 1000)
}

async function onOtpComplete(value: number[]) {
  if (verifying.value) return
  verifying.value = true
  otpError.value = ''

  try {
    const result = await $fetch<{ success: boolean; token?: string; error?: string }>(
      '/api/auth/phone/verify',
      { method: 'POST', body: { phone: props.phone, code: value.join('') } }
    )

    if (result.success && result.token) {
      otpToken.value = result.token
      finish()
    } else {
      otpError.value = result.error ?? 'invalid_code'
      otpValue.value = []
    }
  } catch {
    otpError.value = 'invalid_code'
    otpValue.value = []
  } finally {
    verifying.value = false
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

function finish() {
  emit('done', {
    firstName: firstName.value.trim(),
    otpToken: otpToken.value
  })
}

const busy = computed(() => props.submitting || verifying.value)

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <UDrawer
    v-model:open="open"
    :dismissible="!busy"
    :title="stage === 'details' ? $ts('booking.verify.detailsTitle') : $ts('booking.sms.title')"
    :description="
      stage === 'details'
        ? $ts('booking.verify.detailsDescription')
        : channel
          ? $ts('booking.sms.codeSentTo', { channel: channelName, phone: phoneDisplay })
          : phoneDisplay
    "
    :ui="{
      container: 'mx-auto w-full max-w-lg',
      footer: 'flex-col gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]'
    }"
  >
    <template #body>
      <!-- Stage 1: new client details -->
      <div v-if="stage === 'details'" class="flex flex-col gap-4">
        <UFormField
          :label="$ts('booking.steps.confirm.firstName')"
          :error="nameTouched && nameMissing ? $ts('booking.errors.nameRequired') : false"
          required
        >
          <UInput
            v-model="firstName"
            size="xl"
            icon="i-lucide-user"
            autocomplete="given-name"
            autofocus
            class="w-full"
            @keydown.enter.prevent="submitDetails"
          />
        </UFormField>
        <div class="flex items-center gap-2 rounded-2xl bg-elevated px-4 py-3 text-sm text-muted">
          <UIcon name="i-lucide-phone" class="size-4 shrink-0" />
          <span class="font-medium text-highlighted">{{ phoneDisplay }}</span>
        </div>
      </div>

      <!-- Stage 2: one-time code (after a channel is chosen) -->
      <div v-else class="flex flex-col items-center gap-5 py-2">
        <div v-if="!channel" class="py-4" />

        <div v-else-if="sending && !resendCountdown" class="flex flex-col items-center gap-3 py-4">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
          <span class="text-sm text-muted">{{ $ts('booking.verify.sendingCode') }}</span>
        </div>

        <template v-else>
          <UPinInput
            v-model="otpValue"
            :length="4"
            type="number"
            size="xl"
            :disabled="busy"
            :highlight="Boolean(otpError)"
            :color="otpError ? 'error' : 'primary'"
            otp
            autofocus
            :ui="{
              root: 'gap-2.5',
              base: 'h-15 w-12 !rounded-lg text-2xl font-semibold tabular-nums'
            }"
            @complete="onOtpComplete"
          />

          <p v-if="verifying" class="flex items-center gap-2 text-sm text-muted" role="status">
            <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
            {{ $ts('booking.verify.checkingCode') }}
          </p>

          <UAlert
            v-if="otpError"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-alert"
            :title="otpErrorMessage(otpError)"
          />

          <!-- DEV ONLY: show the OTP code so it can be entered during testing -->
          <UAlert
            v-if="devCode"
            color="warning"
            variant="subtle"
            icon="i-lucide-flask-conical"
            :title="$ts('booking.sms.devCode', { code: devCode })"
          />

          <div class="text-sm text-muted">
            <span v-if="resendCountdown > 0">
              {{
                $ts('booking.sms.resendIn', {
                  countdown: `0:${String(resendCountdown).padStart(2, '0')}`
                })
              }}
            </span>
            <UButton
              v-else
              variant="link"
              color="neutral"
              :loading="sending"
              :label="$ts('booking.sms.resend')"
              @click="sendCode"
            />
          </div>

          <UButton
            variant="link"
            color="neutral"
            size="sm"
            :disabled="busy || sending"
            :label="$ts('booking.verify.otherChannel')"
            class="-mt-3 text-muted"
            @click="channelPickerOpen = true"
          />
        </template>
      </div>
    </template>

    <template #footer>
      <UButton
        v-if="stage === 'details'"
        size="xl"
        block
        color="primary"
        :loading="busy || sending"
        :label="needsCode ? $ts('booking.verify.getCode') : $ts('booking.footer.book')"
        :trailing-icon="needsCode ? 'i-lucide-arrow-right' : undefined"
        :ui="{ trailingIcon: 'ms-0' }"
        @click="submitDetails"
      />
      <UButton
        v-else-if="submitting"
        size="xl"
        block
        color="primary"
        loading
        :label="$ts('booking.steps.confirm.creatingBooking')"
      />
      <UButton
        size="lg"
        block
        variant="ghost"
        color="neutral"
        :disabled="busy"
        :label="$ts('booking.verify.changePhone')"
        @click="open = false"
      />
    </template>
  </UDrawer>

  <!-- Channel picker: a popup over the drawer; a choice is required to get a code -->
  <UModal
    v-model:open="channelPickerOpen"
    :title="$ts('booking.verify.channelTitle')"
    :description="$ts('booking.verify.channelDescription', { phone: phoneDisplay })"
    :ui="{ content: 'max-w-sm rounded-xl', body: 'flex flex-col gap-2.5' }"
  >
    <template #body>
      <UButton
        v-for="item in CHANNELS"
        :key="item.id"
        color="neutral"
        variant="outline"
        size="xl"
        block
        :label="$ts(`booking.verify.channels.${item.id}.action`)"
        :ui="{
          base: 'h-14 justify-start gap-3 rounded-xl px-4',
          leadingIcon: `size-6 ${item.iconClass}`,
          trailingIcon: 'size-4 text-dimmed'
        }"
        :icon="item.icon"
        trailing-icon="i-lucide-chevron-right"
        @click="chooseChannel(item.id)"
      />
    </template>
  </UModal>
</template>
