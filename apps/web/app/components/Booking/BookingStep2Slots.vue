<script setup lang="ts">
import type { MasterPageData } from '#shared/types/master'

interface DayOption {
  date: string
  weekday: string
  day: string
  label: string
  slots: string[]
}

const props = defineProps<{
  data: MasterPageData
  /** The slot she had picked was taken while she was filling in her details. */
  slotTaken?: boolean
}>()

defineEmits<{
  changeServices: []
  next: []
}>()

const { $ts, getLocale } = useI18n()
const username = computed(() => props.data.profile.username)
const bookingState = useBookingState(username.value)
const summary = useBookingSummary(() => props.data)
const timezone = computed(() => props.data.timezone)
const { formatTime } = useMasterFormat(() => props.data.settings, timezone)

const {
  data: availability,
  isPending,
  error,
  refetch
} = useBookingAvailability(username, () => bookingState.value.selectedServiceIds)

// Days are plain dates in the master's time zone: format them as such (noon UTC
// stays on the same date in every zone the formatter could use).
function dateAt(date: string) {
  return new Date(`${date}T12:00:00Z`)
}

const days = computed<DayOption[]>(() => {
  const short = new Intl.DateTimeFormat(getLocale(), { weekday: 'short', timeZone: 'UTC' })
  const long = new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  })

  return (availability.value ?? []).map(({ date, slots }) => {
    const weekday = short.format(dateAt(date)).replace(/\.$/, '')
    return {
      date,
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      day: String(Number(date.slice(8, 10))),
      label: slots.length
        ? long.format(dateAt(date))
        : `${long.format(dateAt(date))}, ${$ts('booking.steps.slots.dayFull')}`,
      slots
    }
  })
})

const hasAnyFreeDay = computed(() => days.value.some((day) => day.slots.length > 0))
const selectedDay = computed(() =>
  days.value.find((day) => day.date === bookingState.value.selectedDate)
)

// "October – November" across the horizon.
const monthsLabel = computed(() => {
  const first = days.value[0]?.date
  const last = days.value.at(-1)?.date
  if (!first || !last) return ''
  const month = new Intl.DateTimeFormat(getLocale(), { month: 'long', timeZone: 'UTC' })
  const from = month.format(dateAt(first))
  const to = month.format(dateAt(last))
  const label = from === to ? from : `${from} – ${to}`
  return label.charAt(0).toUpperCase() + label.slice(1)
})

// "Bishkek time": a phrase per known zone, else the master's city.
const ZONE_KEYS: Record<string, string> = {
  'Asia/Bishkek': 'bishkek',
  'Asia/Almaty': 'almaty',
  'America/Toronto': 'toronto',
  'America/Vancouver': 'vancouver',
  'America/Edmonton': 'edmonton',
  'America/Winnipeg': 'winnipeg',
  'America/Halifax': 'halifax'
}

const timezoneLabel = computed(() => {
  const key = ZONE_KEYS[timezone.value]
  if (key) return $ts(`booking.steps.slots.zones.${key}`)
  const place =
    props.data.profile.city ?? (timezone.value.split('/').at(-1) ?? '').replace(/_/g, ' ')
  return $ts('booking.steps.slots.timezone', { place })
})

const hourFormatter = computed(
  () =>
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: timezone.value
    })
)

const slotGroups = computed(() => {
  const groups = [
    { key: 'morning', slots: [] as string[] },
    { key: 'afternoon', slots: [] as string[] },
    { key: 'evening', slots: [] as string[] }
  ]

  for (const slot of selectedDay.value?.slots ?? []) {
    const hour = Number(hourFormatter.value.format(new Date(slot)))
    groups[hour < 12 ? 0 : hour < 17 ? 1 : 2]!.slots.push(slot)
  }

  return groups.filter((group) => group.slots.length > 0)
})

// Keep the stored choice only while it is still free; otherwise jump to the
// first day with free time.
watch(
  days,
  (list) => {
    if (!list.length) return

    const current = list.find((day) => day.date === bookingState.value.selectedDate)
    if (current?.slots.length) {
      if (
        bookingState.value.selectedSlot &&
        !current.slots.includes(bookingState.value.selectedSlot)
      ) {
        bookingState.value.selectedSlot = null
      }
      return
    }

    bookingState.value.selectedDate = list.find((day) => day.slots.length > 0)?.date ?? null
    bookingState.value.selectedSlot = null
  },
  { immediate: true }
)

const stripRef = useTemplateRef<HTMLElement>('strip')

function scrollToSelected(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    stripRef.value
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView({ behavior, inline: 'center', block: 'nearest' })
  })
}

watch(isPending, (pending) => !pending && scrollToSelected('auto'), { immediate: true })

function selectDate(day: DayOption) {
  if (!day.slots.length) return
  bookingState.value.selectedDate = day.date
  bookingState.value.selectedSlot = null
  scrollToSelected()
}

const nextLabel = computed(() => {
  const slot = bookingState.value.selectedSlot
  if (!slot) return $ts('booking.header.next')
  const day = new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short',
    day: 'numeric',
    timeZone: timezone.value
  })
    .format(new Date(slot))
    .replace(/[.,]/g, '')
  return `${$ts('booking.header.next')} · ${day}, ${formatTime(slot)}`
})
</script>

<template>
  <section class="flex flex-1 flex-col">
    <div class="seene-reveal flex flex-col gap-4.5 px-4 pt-2">
      <h1 class="mx-1 font-display text-[26px] font-bold tracking-[-0.03em] text-highlighted">
        {{ $ts('booking.steps.slots.title') }}
      </h1>

      <div class="flex items-center gap-3 rounded-[16px] bg-muted px-3.5 py-3">
        <BookingThumb
          v-if="summary.services.value[0]"
          :service="summary.services.value[0]"
          class="size-10 rounded-[10px] text-sm"
        />
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <p class="text-sm font-semibold text-highlighted">{{ summary.name.value }}</p>
          <p class="text-[13px] text-muted">{{ summary.details.value }}</p>
        </div>
        <UButton
          variant="link"
          :label="$ts('booking.steps.slots.change')"
          class="shrink-0 p-1 text-sm font-semibold text-(--seene-accent-text) hover:text-(--seene-accent-text)"
          @click="$emit('changeServices')"
        />
      </div>

      <UAlert
        v-if="slotTaken"
        color="warning"
        variant="subtle"
        icon="i-lucide-clock-alert"
        class="rounded-[14px]"
        :title="$ts('booking.steps.slots.taken')"
      />

      <UAlert
        v-if="error && !availability"
        color="error"
        variant="subtle"
        icon="i-lucide-wifi-off"
        class="rounded-[14px]"
        :title="$ts('booking.steps.slots.loadFailed')"
        :actions="[
          {
            label: $ts('booking.steps.slots.retry'),
            color: 'error',
            variant: 'solid',
            onClick: () => void refetch()
          }
        ]"
      />

      <template v-else-if="isPending">
        <div class="-mx-4 flex gap-1.5 overflow-hidden px-4" aria-hidden="true">
          <USkeleton v-for="index in 7" :key="index" class="h-18 w-13 shrink-0 rounded-[16px]" />
        </div>
        <div class="grid grid-cols-4 gap-1.5" aria-hidden="true">
          <USkeleton v-for="index in 6" :key="index" class="h-11 rounded-[12px]" />
        </div>
      </template>

      <UEmpty
        v-else-if="!hasAnyFreeDay"
        icon="i-lucide-calendar-x"
        :title="$ts('booking.steps.slots.noSlots')"
        :description="
          $ts('booking.steps.slots.noUpcomingSlots', { days: data.settings.booking_horizon_days })
        "
        variant="naked"
      />

      <template v-else>
        <div class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between gap-3 px-1">
            <span class="text-[15px] font-semibold text-highlighted">{{ monthsLabel }}</span>
            <span class="text-xs text-muted">{{ timezoneLabel }}</span>
          </div>

          <div
            ref="strip"
            class="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]"
          >
            <button
              v-for="day in days"
              :key="day.date"
              type="button"
              :disabled="!day.slots.length"
              :aria-pressed="bookingState.selectedDate === day.date"
              :aria-label="day.label"
              class="flex h-18 w-13 shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40"
              :class="
                bookingState.selectedDate === day.date
                  ? 'border-primary bg-primary text-inverted'
                  : 'border-default bg-elevated text-highlighted'
              "
              @click="selectDate(day)"
            >
              <span class="text-xs">{{ day.weekday }}</span>
              <span class="font-display text-lg leading-none font-bold">{{ day.day }}</span>
              <span
                class="size-1 rounded-full"
                :class="
                  !day.slots.length
                    ? 'bg-transparent'
                    : bookingState.selectedDate === day.date
                      ? 'bg-(--ui-text-inverted)'
                      : 'bg-primary'
                "
              />
            </button>
          </div>
        </div>

        <div v-for="group in slotGroups" :key="group.key" class="flex flex-col gap-2">
          <p class="px-1 text-[13px] text-muted">
            {{ $ts(`booking.steps.slots.groups.${group.key}`) }}
          </p>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="slot in group.slots"
              :key="slot"
              type="button"
              :aria-pressed="bookingState.selectedSlot === slot"
              class="h-11 rounded-[12px] border text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :class="
                bookingState.selectedSlot === slot
                  ? 'border-primary bg-primary text-inverted'
                  : 'border-default bg-elevated text-highlighted'
              "
              @click="bookingState.selectedSlot = slot"
            >
              {{ formatTime(slot) }}
            </button>
          </div>
        </div>
      </template>
      <div class="h-2" />
    </div>

    <BookingFooter
      :label="nextLabel"
      :disabled="!bookingState.selectedSlot"
      @click="$emit('next')"
    />
  </section>
</template>
