<script setup lang="ts">
interface MasterProfile {
  first_name: string
  last_name: string
  city: string | null
  address: string | null
  house_number: string | null
  zip_code: string | null
  country: string
  works_at_place: boolean
}

const props = defineProps<{
  username: string
  profile?: MasterProfile
}>()

const { $ts, $localePath, getLocale } = useI18n()
const bookingState = useBookingState(props.username)

const booking = computed(() => bookingState.value.booking)

const masterName = computed(() => {
  const master = booking.value?.master
  if (master) {
    return `${master.first_name} ${master.last_name}`.trim()
  }

  if (props.profile) {
    return `${props.profile.first_name} ${props.profile.last_name}`.trim()
  }

  return props.username
})

const masterInitials = computed(() =>
  masterName.value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
)

const serviceNames = computed(() => booking.value?.services.map((service) => service.name) ?? [])

const formattedDateTime = computed(() => {
  if (!booking.value?.startsAt) return ''

  return new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(booking.value.startsAt))
})

const address = computed(() => {
  if (!props.profile?.works_at_place) return ''

  return [
    props.profile.address,
    props.profile.house_number,
    props.profile.city,
    props.profile.zip_code,
    props.profile.country
  ]
    .filter(Boolean)
    .join(', ')
})

function returnToProfile() {
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
  void navigateTo($localePath(`/${props.username}`))
}

function downloadCalendarFile() {
  const currentBooking = booking.value
  if (!currentBooking || !import.meta.client) return

  const event = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Seene//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${currentBooking.id}@seene`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(new Date(currentBooking.startsAt))}`,
    `DTEND:${toIcsDate(new Date(currentBooking.endsAt))}`,
    `SUMMARY:${escapeIcsText($ts('booking.steps.success.calendarTitle', { master: masterName.value }))}`,
    `DESCRIPTION:${escapeIcsText(serviceNames.value.join(', '))}`,
    ...(address.value ? [`LOCATION:${escapeIcsText(address.value)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `seene-booking-${currentBooking.id}.ics`
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
  <section class="flex min-h-full flex-col gap-6">
    <header class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-(--ui-text-highlighted)">
          {{ masterName }}
        </p>
      </div>

      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="lg"
        :aria-label="$ts('booking.steps.success.closeAria')"
        @click="returnToProfile"
      />
    </header>

    <div class="flex flex-col items-center gap-3 text-center">
      <div
        class="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20"
      >
        <UIcon name="i-lucide-check" class="size-10" />
      </div>

      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold text-(--ui-text-highlighted)">
          {{ $ts('booking.steps.success.title') }}
        </h1>
        <p class="text-sm text-(--ui-text-muted)">
          {{ $ts('booking.steps.success.description') }}
        </p>
      </div>
    </div>

    <UCard variant="outline" :ui="{ body: 'p-4 sm:p-4' }">
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <UAvatar
            :text="masterInitials"
            :alt="$ts('booking.steps.success.masterAvatarAlt', { master: masterName })"
            size="lg"
          />
          <div class="min-w-0">
            <p class="text-xs text-(--ui-text-muted)">{{ $ts('booking.steps.success.master') }}</p>
            <p class="truncate text-sm font-medium text-(--ui-text-highlighted)">
              {{ masterName }}
            </p>
          </div>
        </div>

        <USeparator />

        <div class="flex flex-col gap-2">
          <p class="text-xs text-(--ui-text-muted)">{{ $ts('booking.steps.success.services') }}</p>
          <ul class="flex flex-col gap-1">
            <li
              v-for="service in serviceNames"
              :key="service"
              class="flex items-start gap-2 text-sm text-(--ui-text-highlighted)"
            >
              <UIcon name="i-lucide-sparkles" class="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{{ service }}</span>
            </li>
          </ul>
        </div>

        <USeparator />

        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-calendar-clock" class="size-5 shrink-0 text-(--ui-text-muted)" />
          <div class="min-w-0">
            <p class="text-xs text-(--ui-text-muted)">{{ $ts('booking.steps.success.dateTime') }}</p>
            <p class="text-sm font-medium capitalize text-(--ui-text-highlighted)">
              {{ formattedDateTime }}
            </p>
          </div>
        </div>

        <template v-if="address">
          <USeparator />
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-map-pin" class="size-5 shrink-0 text-(--ui-text-muted)" />
            <div class="min-w-0">
              <p class="text-xs text-(--ui-text-muted)">{{ $ts('booking.steps.success.address') }}</p>
              <p class="text-sm font-medium text-(--ui-text-highlighted)">
                {{ address }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </UCard>

    <div class="mt-auto flex flex-col gap-3 pb-2">
      <UButton
        block
        size="lg"
        icon="i-lucide-calendar-plus"
        :label="$ts('booking.addToCalendar')"
        :disabled="!booking"
        @click="downloadCalendarFile"
      />
      <UButton
        block
        size="lg"
        color="neutral"
        variant="outline"
        icon="i-lucide-user"
        :label="$ts('booking.steps.success.returnToProfile')"
        @click="returnToProfile"
      />
    </div>
  </section>
</template>
