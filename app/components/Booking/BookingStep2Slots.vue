<script setup lang="ts">
interface DayOption {
  date: string
  dayLabel: string
  dayNumber: string
  slots: string[]
}

interface SlotGroup {
  key: 'morning' | 'afternoon' | 'evening'
  icon: string
  slots: string[]
}

const props = defineProps<{
  username: string
}>()

const { $ts, getLocale } = useI18n()
const bookingState = useBookingState(props.username)

const { data: masterData } = useMasterData(() => props.username)
const { formatTime, formatWeekdayDate } = useMasterFormat(() => masterData.value?.settings)

const {
  data: availability,
  isPending,
  error,
  refetch
} = useBookingAvailability(
  () => props.username,
  () => bookingState.value.selectedServiceIds
)

const days = computed<DayOption[]>(() => {
  const formatter = new Intl.DateTimeFormat(getLocale(), { weekday: 'short', day: 'numeric' })

  return (availability.value ?? []).map(({ date, slots }) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(parseLocalDate(date)).map((part) => [part.type, part.value])
    )
    return { date, dayLabel: parts.weekday ?? '', dayNumber: parts.day ?? '', slots }
  })
})

const hasAnyFreeDay = computed(() => days.value.some((day) => day.slots.length > 0))
const selectedDay = computed(() =>
  days.value.find((day) => day.date === bookingState.value.selectedDate)
)

const monthLabel = computed(() => {
  const date = bookingState.value.selectedDate ?? days.value[0]?.date
  if (!date) return ''
  return new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(
    parseLocalDate(date)
  )
})

const slotGroups = computed<SlotGroup[]>(() => {
  const groups: SlotGroup[] = [
    { key: 'morning', icon: 'i-lucide-sunrise', slots: [] },
    { key: 'afternoon', icon: 'i-lucide-sun', slots: [] },
    { key: 'evening', icon: 'i-lucide-moon', slots: [] }
  ]

  for (const slot of selectedDay.value?.slots ?? []) {
    const hour = new Date(slot).getHours()
    groups[hour < 12 ? 0 : hour < 17 ? 1 : 2]!.slots.push(slot)
  }

  return groups.filter((group) => group.slots.length > 0)
})

// Keep the stored selection only while it is still free; otherwise jump to the
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

// --- Day strip scrolling ---

const stripRef = ref<HTMLElement | null>(null)

function scrollToSelected(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    stripRef.value
      ?.querySelector<HTMLElement>('[data-selected="true"]')
      ?.scrollIntoView({ behavior, inline: 'center', block: 'nearest' })
  })
}

watch(
  () => isPending.value,
  (pending) => {
    if (!pending) scrollToSelected('auto')
  },
  { immediate: true }
)

function selectDate(day: DayOption) {
  if (!day.slots.length) return
  bookingState.value.selectedDate = day.date
  bookingState.value.selectedSlot = null
  scrollToSelected()
}

function selectSlot(slot: string) {
  bookingState.value.selectedSlot = slot
}

function slotCountLabel(count: number) {
  return $ts('booking.steps.slots.slotCount', { count })
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold text-highlighted">
        {{ $ts('booking.steps.slots.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ $ts('booking.steps.slots.description') }}
      </p>
    </div>

    <UAlert
      v-if="error && !availability"
      color="error"
      variant="subtle"
      icon="i-lucide-wifi-off"
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

    <!-- Loading: day strip + slot grid placeholders -->
    <template v-else-if="isPending">
      <USkeleton class="h-5 w-32" />
      <div class="-mx-4 flex gap-2 overflow-hidden px-4" aria-hidden="true">
        <USkeleton v-for="index in 7" :key="index" class="h-[84px] w-16 shrink-0 rounded-2xl" />
      </div>
      <div class="flex flex-col gap-3" aria-hidden="true">
        <USkeleton class="h-4 w-24" />
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <USkeleton v-for="index in 8" :key="index" class="h-12 rounded-3xl" />
        </div>
      </div>
      <p class="flex items-center justify-center gap-2 text-sm text-muted" role="status">
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
        {{ $ts('booking.steps.slots.loading') }}
      </p>
    </template>

    <UEmpty
      v-else-if="!hasAnyFreeDay"
      icon="i-lucide-calendar-x"
      :title="$ts('booking.steps.slots.noSlots')"
      :description="$ts('booking.steps.slots.noUpcomingSlots')"
      variant="naked"
    />

    <template v-else>
      <!-- Day strip -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-base font-semibold capitalize text-highlighted">{{ monthLabel }}</span>
          <div class="flex items-center gap-3 text-xs text-muted">
            <span class="inline-flex items-center gap-1.5">
              <span class="size-2 rounded-full bg-success" />
              {{ $ts('booking.steps.slots.legendFree') }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="size-2 rounded-full bg-accented" />
              {{ $ts('booking.steps.slots.legendBusy') }}
            </span>
          </div>
        </div>

        <div ref="stripRef" class="-mx-4 snap-x overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <div class="flex w-max gap-2">
            <UButton
              v-for="day in days"
              :key="day.date"
              :data-selected="bookingState.selectedDate === day.date"
              :disabled="!day.slots.length"
              :aria-pressed="bookingState.selectedDate === day.date"
              :aria-label="
                day.slots.length
                  ? `${formatWeekdayDate(parseLocalDate(day.date))}, ${slotCountLabel(day.slots.length)}`
                  : `${formatWeekdayDate(parseLocalDate(day.date))}, ${$ts('booking.steps.slots.dayFull')}`
              "
              color="neutral"
              variant="outline"
              :ui="{
                base: [
                  'h-[84px] w-16 shrink-0 snap-center flex-col justify-center gap-0.5 rounded-2xl p-0 transition',
                  bookingState.selectedDate === day.date
                    ? 'bg-inverted text-inverted ring-inverted hover:bg-inverted/90'
                    : day.slots.length
                      ? 'bg-default text-highlighted'
                      : 'bg-elevated text-dimmed ring-transparent disabled:opacity-100'
                ].join(' ')
              }"
              @click="selectDate(day)"
            >
              <span class="text-[11px] font-medium uppercase opacity-80">{{ day.dayLabel }}</span>
              <span
                class="text-xl font-semibold leading-tight"
                :class="{ 'line-through decoration-1': !day.slots.length }"
              >
                {{ day.dayNumber }}
              </span>
              <span
                class="size-1.5 rounded-full"
                :class="day.slots.length ? 'bg-success' : 'bg-transparent'"
              />
            </UButton>
          </div>
        </div>
      </div>

      <!-- Slots for the selected day -->
      <div v-if="selectedDay" class="flex flex-col gap-4">
        <div class="flex items-baseline justify-between gap-3">
          <span class="text-sm font-medium capitalize text-highlighted">
            {{ formatWeekdayDate(parseLocalDate(selectedDay.date)) }}
          </span>
          <span class="text-xs text-muted">{{ slotCountLabel(selectedDay.slots.length) }}</span>
        </div>

        <div v-for="group in slotGroups" :key="group.key" class="flex flex-col gap-2">
          <span class="inline-flex items-center gap-1.5 text-xs font-medium uppercase text-muted">
            <UIcon :name="group.icon" class="size-3.5" />
            {{ $ts(`booking.steps.slots.groups.${group.key}`) }}
          </span>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <UButton
              v-for="slot in group.slots"
              :key="slot"
              :label="formatTime(slot)"
              :variant="bookingState.selectedSlot === slot ? 'solid' : 'outline'"
              :aria-pressed="bookingState.selectedSlot === slot"
              color="primary"
              size="lg"
              block
              class="h-12 text-base font-medium"
              @click="selectSlot(slot)"
            />
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
