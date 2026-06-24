<script setup lang="ts">
interface AvailabilityItem {
  date: string
  available: boolean
}

interface SlotsResponse {
  slots: string[]
  nextAvailableDate: string | null
}

interface DayOption {
  date: string
  dayLabel: string
  dayNumber: string
  monthLabel: string
}

const props = defineProps<{
  username: string
}>()

const { $ts, getLocale } = useI18n()
const bookingState = useBookingState(props.username)

const { data: masterData } = useMasterData(() => props.username)
const { formatTime, formatWeekdayDate } = useMasterFormat(() => masterData.value?.settings)

const selectedServiceKey = computed(() => bookingState.value.selectedServiceIds.join(','))
const dayOptions = computed(() => buildDayOptions(getLocale()))

// --- Availability: one request for the 30-day calendar ---

const { data: availabilityData, status: availabilityStatus } = useAsyncData(
  () => `booking-availability:${props.username}:${selectedServiceKey.value}`,
  async () => {
    if (!selectedServiceKey.value) return [] as AvailabilityItem[]
    const today = formatLocalDate(new Date())
    const to = addLocalDays(today, 29)
    return $fetch<AvailabilityItem[]>(`/api/master/${props.username}/availability`, {
      query: { from: today, to, service_ids: selectedServiceKey.value }
    })
  },
  { watch: [selectedServiceKey] }
)

const availabilityMap = computed<Record<string, boolean>>(() =>
  Object.fromEntries((availabilityData.value ?? []).map(({ date, available }) => [date, available]))
)
const isAvailabilityLoading = computed(() => availabilityStatus.value === 'pending')

// --- Slots: one request per selected date ---

const selectedDateSlots = ref<SlotsResponse | null>(null)
const slotsLoading = ref(false)

async function loadSlotsForDate(date: string) {
  if (!selectedServiceKey.value) return
  slotsLoading.value = true
  selectedDateSlots.value = null
  try {
    selectedDateSlots.value = await $fetch<SlotsResponse>(`/api/master/${props.username}/slots`, {
      query: { from: date, to: date, service_ids: selectedServiceKey.value }
    })
  } finally {
    slotsLoading.value = false
  }
}

// --- Derived state ---

const selectedSlots = computed(() => selectedDateSlots.value?.slots ?? [])

const nextAvailableDate = computed(() => {
  if (selectedDateSlots.value?.nextAvailableDate) {
    return selectedDateSlots.value.nextAvailableDate
  }
  return dayOptions.value.find((day) => availabilityMap.value[day.date] === true)?.date ?? null
})

// --- Watchers ---

watch(selectedServiceKey, () => {
  bookingState.value.selectedDate = null
  bookingState.value.selectedSlot = null
  selectedDateSlots.value = null
})

watch(
  availabilityMap,
  () => {
    if (isAvailabilityLoading.value) return

    const selectedDate = bookingState.value.selectedDate
    if (selectedDate && hasSlots(selectedDate)) return

    const firstAvailable = dayOptions.value.find((day) => hasSlots(day.date))?.date ?? null
    bookingState.value.selectedDate = firstAvailable
    bookingState.value.selectedSlot = null

    if (firstAvailable) {
      loadSlotsForDate(firstAvailable)
    }
  },
  { immediate: true }
)

// --- Actions ---

function hasSlots(date: string) {
  return availabilityMap.value[date] === true
}

function selectDate(date: string) {
  if (!hasSlots(date)) return
  bookingState.value.selectedDate = date
  bookingState.value.selectedSlot = null
  loadSlotsForDate(date)
}

function selectSlot(slot: string) {
  bookingState.value.selectedSlot = slot
}

function goToNextAvailableDate() {
  if (!nextAvailableDate.value) return
  const date = nextAvailableDate.value
  bookingState.value.selectedDate = date
  bookingState.value.selectedSlot = null
  loadSlotsForDate(date)
}

function formatSlotTime(slot: string) {
  return formatTime(slot)
}

function formatFullDate(date: string) {
  return formatWeekdayDate(parseLocalDate(date))
}

function buildDayOptions(locale: string): DayOption[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
  const today = new Date()

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(today.getDate() + index)

    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((part) => [part.type, part.value])
    )

    return {
      date: formatLocalDate(date),
      dayLabel: parts.weekday ?? '',
      dayNumber: parts.day ?? '',
      monthLabel: parts.month ?? ''
    }
  })
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addLocalDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  parsed.setUTCDate(parsed.getUTCDate() + days)
  return parsed.toISOString().slice(0, 10)
}

function parseLocalDate(date: string) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)

  return new Date(year, month - 1, day)
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-semibold text-(--ui-text-highlighted)">
        {{ $ts('booking.steps.slots.title') }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ $ts('booking.steps.slots.description') }}
      </p>
    </div>

    <div class="-mx-4 overflow-x-auto px-4 pb-1">
      <div class="flex w-max gap-2">
        <button
          v-for="day in dayOptions"
          :key="day.date"
          type="button"
          class="flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-(--ui-border-muted) text-sm transition"
          :class="[
            bookingState.selectedDate === day.date
              ? 'border-primary bg-primary text-white'
              : 'bg-(--ui-bg) text-(--ui-text-highlighted)',
            !isAvailabilityLoading && !hasSlots(day.date)
              ? 'cursor-not-allowed opacity-40'
              : 'hover:border-primary/60'
          ]"
          :disabled="!isAvailabilityLoading && !hasSlots(day.date)"
          @click="selectDate(day.date)"
        >
          <span class="text-xs font-medium uppercase">{{ day.dayLabel }}</span>
          <span class="text-lg font-semibold leading-tight">{{ day.dayNumber }}</span>
          <span class="text-xs capitalize opacity-80">{{ day.monthLabel }}</span>
        </button>
      </div>
    </div>

    <div v-if="slotsLoading" class="grid grid-cols-3 gap-2" aria-hidden="true">
      <USkeleton v-for="index in 9" :key="index" class="h-10 rounded-md" />
    </div>

    <div v-else-if="selectedSlots.length > 0" class="grid grid-cols-3 gap-2">
      <UButton
        v-for="slot in selectedSlots"
        :key="slot"
        :label="formatSlotTime(slot)"
        :variant="bookingState.selectedSlot === slot ? 'solid' : 'outline'"
        color="primary"
        block
        @click="selectSlot(slot)"
      />
    </div>

    <UAlert
      v-else
      color="neutral"
      variant="subtle"
      icon="i-lucide-clock"
      :title="$ts('booking.steps.slots.noSlots')"
      :description="
        nextAvailableDate
          ? $ts('booking.steps.slots.nextAvailable', {
              date: formatFullDate(nextAvailableDate)
            })
          : $ts('booking.steps.slots.noUpcomingSlots')
      "
      :actions="
        nextAvailableDate
          ? [
              {
                label: $ts('booking.steps.slots.goToNextAvailable'),
                color: 'primary',
                variant: 'solid',
                onClick: goToNextAvailableDate
              }
            ]
          : []
      "
    />
  </section>
</template>
