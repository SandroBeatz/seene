<script setup lang="ts">
import { DialogDescription, DialogTitle } from 'reka-ui'
import type { MasterPageData } from '#shared/types/master'

/**
 * Moving a booking from its personal link: one screen with the day and time,
 * then "Move". The link is the proof, so there is no phone or code step; the
 * services stay the old booking's.
 */
const props = defineProps<{
  data: MasterPageData
  /** Token of the booking being moved */
  token: string
  /** Start of the booking being moved (ISO) */
  startsAt: string
  serviceIds: string[]
}>()

const emit = defineEmits<{
  /** The new booking's link token */
  moved: [token: string]
  /** The booking can no longer be moved (window closed, cancelled meanwhile) */
  unavailable: []
}>()

const open = defineModel<boolean>('open', { required: true })

const { $ts, getLocale } = useI18n()
const queryCache = useQueryCache()
const username = computed(() => props.data.profile.username)
const bookingState = useBookingState(username.value)
const { formatTime } = useMasterFormat(
  () => props.data.settings,
  () => props.data.timezone
)

const profile = computed(() => props.data.profile)
const fullName = computed(() => `${profile.value.first_name} ${profile.value.last_name}`.trim())
const initials = computed(() =>
  `${profile.value.first_name[0] ?? ''}${profile.value.last_name[0] ?? ''}`.toUpperCase()
)

const moving = ref(false)
const slotTaken = ref(false)
const error = ref('')

// Each opening starts with the old booking's services and no time picked.
watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    bookingState.value = createBookingState({
      phone: bookingState.value.phone,
      selectedServiceIds: props.serviceIds
    })
    slotTaken.value = false
    error.value = ''
  },
  { immediate: true }
)

/** "Mon, 26 Oct, 11:30" */
const movingFrom = computed(() => {
  const day = new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: props.data.timezone
  }).format(new Date(props.startsAt))
  return `${day}, ${formatTime(props.startsAt)}`
})

async function move() {
  const startsAt = bookingState.value.selectedSlot
  if (!startsAt || moving.value) return

  moving.value = true
  slotTaken.value = false
  error.value = ''

  try {
    const result = await $fetch<{ token: string }>(`/api/c/${props.token}/reschedule`, {
      method: 'POST',
      body: { starts_at: startsAt }
    })
    queryCache.invalidateQueries({ key: ['booking-availability', username.value] })
    queryCache.invalidateQueries({ key: ['master', username.value, 'nearest'] })
    emit('moved', result.token)
  } catch (e: unknown) {
    const { statusCode, data } = e as { statusCode?: number; data?: { data?: { code?: string } } }
    const code = data?.data?.code

    if (code === 'reschedule_unavailable' || statusCode === 404) {
      emit('unavailable')
    } else if (statusCode === 409 && !code) {
      // Someone took the time meanwhile: fresh slots, pick again.
      bookingState.value.selectedSlot = null
      slotTaken.value = true
      queryCache.invalidateQueries({ key: ['booking-availability', username.value] })
    } else {
      error.value = $ts('cancel.reschedule.failed')
    }
  } finally {
    moving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" fullscreen :close="false" :ui="{ content: 'bg-default' }">
    <template #content>
      <div class="h-full overflow-y-auto overscroll-contain [scrollbar-width:none]">
        <div class="mx-auto flex min-h-full max-w-lg flex-col">
          <DialogTitle class="sr-only">{{ $ts('cancel.move') }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ $ts('cancel.reschedule.from', { when: movingFrom }) }}
          </DialogDescription>

          <header
            class="sticky top-0 z-10 flex items-center justify-between gap-2 bg-default px-4 pt-3.5 pb-3"
          >
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
              :aria-label="$ts('cancel.reschedule.close')"
              class="size-10 justify-center rounded-full bg-muted text-highlighted"
              @click="open = false"
            />
          </header>

          <BookingStep2Slots
            :data="data"
            :slot-taken="slotTaken"
            :action="$ts('cancel.reschedule.action')"
            :loading="moving"
            fixed-services
            @next="move"
          >
            <template #notice>
              <UAlert
                color="neutral"
                variant="subtle"
                icon="i-lucide-calendar-sync"
                class="rounded-[14px]"
                :title="$ts('cancel.reschedule.from', { when: movingFrom })"
                :description="$ts('cancel.reschedule.note')"
              />
              <UAlert
                v-if="error"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                class="rounded-[14px]"
                :title="error"
              />
            </template>
          </BookingStep2Slots>
        </div>
      </div>
    </template>
  </UModal>
</template>
