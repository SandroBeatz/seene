<script setup lang="ts">
import type { MasterPageData } from '#shared/types/master'

const props = defineProps<{
  username: string
  data: MasterPageData
}>()

const { $ts, getLocale } = useI18n()
const bookingState = useBookingState(props.username)
const { formatTime } = useMasterFormat(() => props.data.settings, () => props.data.timezone)

const booking = computed(() => bookingState.value.booking)
const profile = computed(() => props.data.profile)
const confirmed = computed(() => booking.value?.status === 'confirmed')

const masterName = computed(() =>
  `${profile.value.first_name} ${profile.value.last_name}`.trim()
)

const serviceNames = computed(() => booking.value?.services.map((s) => s.name).join(', ') ?? '')

const when = computed(() => {
  const current = booking.value
  if (!current) return ''
  const day = new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: props.data.timezone
  }).format(new Date(current.startsAt))
  return `${day}, ${formatTime(current.startsAt)} – ${formatTime(current.endsAt)}`
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
    `DESCRIPTION:${escapeIcsText(serviceNames.value)}`,
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
  <section v-if="booking" class="flex flex-col gap-6 pt-4">
    <div class="seene-reveal flex flex-col items-center gap-3 text-center">
      <div class="flex size-16 items-center justify-center rounded-full bg-primary text-inverted">
        <UIcon name="i-lucide-check" class="size-8" />
      </div>
      <div class="flex flex-col gap-1">
        <h2 class="font-display text-2xl font-bold text-highlighted">
          {{
            confirmed ? $ts('booking.steps.success.title') : $ts('booking.steps.success.pendingTitle')
          }}
        </h2>
        <p class="text-sm text-muted">
          {{
            confirmed
              ? $ts('booking.steps.success.description', { name: profile.first_name })
              : $ts('booking.steps.success.pendingDescription', { name: profile.first_name })
          }}
        </p>
      </div>
    </div>

    <dl class="flex flex-col gap-3 rounded-[16px] border border-default p-4 text-sm">
      <div class="flex flex-col gap-0.5">
        <dt class="text-xs text-muted">{{ $ts('booking.steps.success.services') }}</dt>
        <dd class="font-medium text-highlighted">{{ serviceNames }}</dd>
      </div>
      <div class="flex flex-col gap-0.5">
        <dt class="text-xs text-muted">{{ $ts('booking.steps.success.dateTime') }}</dt>
        <dd class="font-medium text-highlighted first-letter:uppercase">{{ when }}</dd>
      </div>
      <div class="flex flex-col gap-0.5">
        <dt class="text-xs text-muted">{{ $ts('booking.steps.success.master') }}</dt>
        <dd class="font-medium text-highlighted">{{ masterName }}</dd>
      </div>
      <div v-if="address" class="flex flex-col gap-0.5">
        <dt class="text-xs text-muted">{{ $ts('booking.steps.success.address') }}</dt>
        <dd class="font-medium text-highlighted">{{ address }}</dd>
      </div>
    </dl>

    <div class="grid gap-2" :class="mapUrl ? 'grid-cols-2' : 'grid-cols-1'">
      <UButton
        color="neutral"
        variant="outline"
        size="lg"
        icon="i-lucide-calendar-plus"
        :label="$ts('booking.addToCalendar')"
        class="justify-center rounded-[14px]"
        @click="downloadCalendarFile"
      />
      <UButton
        v-if="mapUrl"
        :to="mapUrl"
        target="_blank"
        rel="noopener noreferrer"
        color="neutral"
        variant="outline"
        size="lg"
        icon="i-lucide-navigation"
        :label="$ts('booking.steps.success.directions')"
        class="justify-center rounded-[14px]"
      />
    </div>
  </section>
</template>
