<script setup lang="ts">
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

const selectedServiceKey = computed(() => bookingState.value.selectedServiceIds.join(','))
const dayOptions = computed(() => buildDayOptions(getLocale()))

const { data, status } = useAsyncData(
  () => `booking-slots:${props.username}:${selectedServiceKey.value}`,
  async () => {
    if (!selectedServiceKey.value) {
      return {} as Record<string, SlotsResponse>
    }

    const entries = await Promise.all(
      dayOptions.value.map(async (day) => {
        const slots = await $fetch<SlotsResponse>(`/api/master/${props.username}/slots`, {
          query: {
            date: day.date,
            service_ids: selectedServiceKey.value
          }
        })

        return [day.date, slots] as const
      })
    )

    return Object.fromEntries(entries)
  },
  {
    watch: [selectedServiceKey]
  }
)

const slotsByDate = computed(() => data.value ?? {})
const selectedDateData = computed(() =>
  bookingState.value.selectedDate ? slotsByDate.value[bookingState.value.selectedDate] : null
)
const selectedSlots = computed(() => selectedDateData.value?.slots ?? [])
const isLoading = computed(() => status.value === 'pending')

const nextAvailableDate = computed(() => {
  if (selectedDateData.value?.nextAvailableDate) {
    return selectedDateData.value.nextAvailableDate
  }

  const apiNextAvailableDate = Object.values(slotsByDate.value).find(
    (dayData) => dayData.nextAvailableDate
  )?.nextAvailableDate
  if (apiNextAvailableDate) {
    return apiNextAvailableDate
  }

  return dayOptions.value.find((day) => hasSlots(day.date))?.date ?? null
})

watch(selectedServiceKey, () => {
  bookingState.value.selectedDate = null
  bookingState.value.selectedSlot = null
})

watch(
  slotsByDate,
  () => {
    if (isLoading.value) {
      return
    }

    const selectedDate = bookingState.value.selectedDate
    if (selectedDate && hasSlots(selectedDate)) {
      return
    }

    const firstAvailableDate = dayOptions.value.find((day) => hasSlots(day.date))?.date ?? null
    bookingState.value.selectedDate = firstAvailableDate
    bookingState.value.selectedSlot = null
  },
  { immediate: true }
)

function hasSlots(date: string) {
  return (slotsByDate.value[date]?.slots.length ?? 0) > 0
}

function selectDate(date: string) {
  if (!hasSlots(date)) {
    return
  }

  bookingState.value.selectedDate = date
  bookingState.value.selectedSlot = null
}

function selectSlot(slot: string) {
  bookingState.value.selectedSlot = slot
}

function goToNextAvailableDate() {
  if (nextAvailableDate.value) {
    selectDate(nextAvailableDate.value)
  }
}

function formatSlotTime(slot: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(slot))
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(parseLocalDate(date))
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
            !isLoading && !hasSlots(day.date)
              ? 'cursor-not-allowed opacity-40'
              : 'hover:border-primary/60'
          ]"
          :disabled="!isLoading && !hasSlots(day.date)"
          @click="selectDate(day.date)"
        >
          <span class="text-xs font-medium uppercase">{{ day.dayLabel }}</span>
          <span class="text-lg font-semibold leading-tight">{{ day.dayNumber }}</span>
          <span class="text-xs capitalize opacity-80">{{ day.monthLabel }}</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="grid grid-cols-3 gap-2" aria-hidden="true">
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
