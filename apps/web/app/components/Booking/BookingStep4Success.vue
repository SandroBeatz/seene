<script setup lang="ts">
import type { MasterPageData } from '#shared/types/master'

const props = defineProps<{
  data: MasterPageData
}>()

defineEmits<{
  close: []
}>()

const { $ts, getLocale } = useI18n()
const bookingState = useBookingState(props.data.profile.username)
const { formatPrice, formatTime } = useMasterFormat(
  () => props.data.settings,
  () => props.data.timezone
)
const { formatDuration } = useMasterPageFormat(() => props.data.settings)

const booking = computed(() => bookingState.value.booking)
const profile = computed(() => props.data.profile)
const confirmed = computed(() => booking.value?.status === 'confirmed')
const rescheduled = computed(() => !!bookingState.value.reschedule)
const masterName = computed(() => `${profile.value.first_name} ${profile.value.last_name}`.trim())

// Services as the master's page shows them (photo, "from" price).
const services = computed(() => {
  const ids = booking.value?.services.map((s) => s.id) ?? []
  return props.data.services.filter((s) => ids.includes(s.id))
})
const serviceName = computed(() => booking.value?.services.map((s) => s.name).join(' + ') ?? '')
const serviceDetails = computed(() => {
  const list = booking.value?.services ?? []
  const minutes = list.reduce((sum, s) => sum + s.duration, 0)
  const amount = formatPrice(list.reduce((sum, s) => sum + priceToNumber(s.price), 0))
  const price = services.value.some((s) => s.price_from)
    ? $ts('booking.service.priceFrom', { price: amount })
    : amount
  return `${formatDuration(minutes)} · ${price}`
})

function formatDay(value: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: props.data.timezone
  }).format(new Date(value))
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** "Friday, 24 October · 11:30" */
const whenFull = computed(() =>
  booking.value
    ? `${capitalize(formatDay(booking.value.startsAt))} · ${formatTime(booking.value.startsAt)}`
    : ''
)

/** "Aigul is expecting you on Friday, 24 October at 11:30" */
const subtitle = computed(() => {
  if (!booking.value) return ''
  const params = {
    name: profile.value.first_name,
    day: new Intl.DateTimeFormat(getLocale(), {
      day: 'numeric',
      month: 'long',
      timeZone: props.data.timezone
    }).format(new Date(booking.value.startsAt)),
    time: formatTime(booking.value.startsAt)
  }
  return confirmed.value
    ? $ts('booking.steps.success.description', params)
    : $ts('booking.steps.success.pendingDescription', params)
})

// Online cancellation closes cancel_window_hours before the visit.
const cancelUntil = computed(() => {
  if (!booking.value) return ''
  const start = new Date(booking.value.startsAt)
  const deadline = new Date(start.getTime() - props.data.settings.cancel_window_hours * 3_600_000)
  const dayKey = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: props.data.timezone }).format(date)
  const time = formatTime(deadline)

  if (dayKey(deadline) === dayKey(start)) return $ts('booking.steps.success.cancelSameDay', { time })
  const dayBefore = new Date(start.getTime() - 86_400_000)
  if (dayKey(deadline) === dayKey(dayBefore)) {
    return $ts('booking.steps.success.cancelDayBefore', { time })
  }
  return $ts('booking.steps.success.cancelOn', { time, day: formatDay(deadline.toISOString()) })
})

const address = computed(() =>
  profile.value.works_at_place
    ? [
        [profile.value.address, profile.value.house_number].filter(Boolean).join(' '),
        profile.value.city
      ]
        .filter(Boolean)
        .join(', ')
    : ''
)

const mapUrl = computed(() => (profile.value.works_at_place ? masterMapLink(profile.value) : null))

function downloadCalendarFile() {
  const current = booking.value
  if (!current || !import.meta.client) return

  const event = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Seene//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${current.id}@seene`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(new Date(current.startsAt))}`,
    `DTEND:${toIcsDate(new Date(current.endsAt))}`,
    `SUMMARY:${escapeIcsText($ts('booking.steps.success.calendarTitle', { master: masterName.value }))}`,
    `DESCRIPTION:${escapeIcsText(serviceName.value)}`,
    ...(address.value ? [`LOCATION:${escapeIcsText(address.value)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `seene-booking-${current.id}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

function toIcsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}
</script>

<template>
  <section class="flex flex-1 flex-col">
    <div v-if="booking" class="seene-reveal flex flex-col gap-5.5 px-5 pt-14">
      <div class="flex flex-col items-center gap-3.5 text-center">
        <span class="flex size-18 items-center justify-center rounded-full bg-primary text-inverted">
          <UIcon name="i-lucide-check" class="size-8" />
        </span>
        <h1 class="font-display text-[28px] font-bold tracking-[-0.03em] text-highlighted">
          {{
            rescheduled
              ? $ts('booking.steps.success.rescheduledTitle')
              : confirmed
                ? $ts('booking.steps.success.title')
                : $ts('booking.steps.success.pendingTitle')
          }}
        </h1>
        <p class="text-[15px] leading-normal text-muted">{{ subtitle }}</p>
      </div>

      <div class="overflow-hidden rounded-[20px] border border-default">
        <div class="flex items-center gap-3 bg-muted px-4 py-3.5">
          <BookingThumb
            v-if="services[0]"
            :service="services[0]"
            class="size-10 rounded-full text-sm"
          />
          <div class="flex min-w-0 flex-col gap-0.5">
            <p class="text-[15px] font-semibold text-highlighted">{{ serviceName }}</p>
            <p class="text-[13px] text-muted">{{ serviceDetails }}</p>
          </div>
        </div>
        <div class="px-4 py-1 text-sm text-highlighted">
          <p
            class="flex items-center gap-3 py-3"
            :class="{ 'border-b border-default': address }"
          >
            <UIcon name="i-lucide-calendar" class="size-4.5 shrink-0" />
            <span class="font-semibold">{{ whenFull }}</span>
          </p>
          <p v-if="address" class="flex items-center gap-3 py-3">
            <UIcon name="i-lucide-map-pin" class="size-4.5 shrink-0" />
            <span>{{ address }}</span>
          </p>
        </div>
      </div>

      <div class="grid gap-2" :class="mapUrl ? 'grid-cols-2' : 'grid-cols-1'">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar-plus"
          :label="$ts('booking.addToCalendar')"
          class="justify-center rounded-[14px] p-3.5 text-sm font-semibold"
          @click="downloadCalendarFile"
        />
        <UButton
          v-if="mapUrl"
          :to="mapUrl"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="outline"
          icon="i-lucide-navigation"
          :label="$ts('booking.steps.success.directions')"
          class="justify-center rounded-[14px] p-3.5 text-sm font-semibold"
        />
      </div>

      <div
        class="flex items-start gap-2.5 rounded-[14px] bg-(--seene-accent-soft) p-3.5 text-[13px] leading-normal text-highlighted"
      >
        <UIcon name="i-lucide-message-circle" class="mt-0.5 size-4 shrink-0" />
        <span>{{ $ts('booking.steps.success.messageNote', { until: cancelUntil }) }}</span>
      </div>
    </div>

    <BookingFooter :label="$ts('booking.steps.success.toProfile')" @click="$emit('close')" />
  </section>
</template>
