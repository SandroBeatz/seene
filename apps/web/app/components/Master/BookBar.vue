<script setup lang="ts">
import type { MasterPageData, NearestSlot } from '#shared/types/master'

const props = defineProps<{
  data: MasterPageData
  bookingEnabled: boolean
}>()

defineEmits<{
  book: []
}>()

const { $ts } = useI18n()
const { formatNearest, formatDayMonth } = useMasterPageFormat(() => props.data.settings)

const username = computed(() => props.data.profile.username)

// Fetched after mount: the hint must not hold up the page render, and the slot is
// live data. A reactive flag, so the query turns on once hydration is done.
const mounted = ref(false)
onMounted(() => (mounted.value = true))

const { data: nearest, status: nearestStatus } = useQuery({
  key: () => ['master', username.value, 'nearest'],
  query: () => $fetch<NearestSlot>(`/api/master/${username.value}/nearest`),
  enabled: () => mounted.value && props.bookingEnabled,
  staleTime: 60_000
})

const nearestLabel = computed(() => {
  if (nearestStatus.value !== 'success' || !nearest.value) return null
  return nearest.value.start_at
    ? $ts('master.book.nearest', {
        when: formatNearest(nearest.value.start_at, nearest.value.timezone)
      })
    : $ts('master.book.noSlots')
})

const vacationUntil = computed(() =>
  activeVacationUntil(props.data.settings, todayIn(props.data.timezone))
)

const whatsappUrl = computed(() => {
  const { whatsapp, first_name } = props.data.profile
  return whatsapp
    ? whatsappLink(whatsapp, $ts('master.book.whatsappText', { name: first_name }))
    : null
})
</script>

<template>
  <div
    v-if="bookingEnabled || whatsappUrl"
    class="sticky bottom-0 z-10 mt-auto bg-linear-to-b from-transparent to-(--ui-bg) to-30% px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
  >
    <p v-if="vacationUntil" class="mb-2 text-center text-xs font-medium text-muted" role="status">
      {{ $ts('master.book.vacation', { date: formatDayMonth(vacationUntil) }) }}
    </p>

    <UButton
      v-if="bookingEnabled"
      size="xl"
      block
      trailing-icon="i-lucide-arrow-right"
      class="seene-rise rounded-[16px] px-4.5 py-3.5 shadow-lg shadow-black/15"
      :ui="{ trailingIcon: 'ms-auto' }"
      @click="$emit('book')"
    >
      <span class="flex flex-col items-start gap-0.5 text-start">
        <span class="text-base font-semibold">{{ $ts('master.book.cta') }}</span>
        <span
          class="min-h-4 text-xs font-normal transition-opacity duration-150"
          :class="nearestLabel ? 'opacity-85' : 'opacity-0'"
          aria-live="polite"
        >
          {{ nearestLabel }}
        </span>
      </span>
    </UButton>

    <div v-else-if="whatsappUrl" class="flex flex-col items-center gap-2">
      <UButton
        :to="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        size="xl"
        block
        icon="i-simple-icons-whatsapp"
        :label="$ts('master.book.whatsapp')"
        class="seene-rise rounded-[16px] bg-[#0E7A3F] py-4 text-base font-semibold text-white shadow-lg shadow-black/15 hover:bg-[#0B6633]"
      />
      <p class="text-xs text-muted">
        {{ $ts('master.book.whatsappHint', { name: data.profile.first_name }) }}
      </p>
    </div>
  </div>
</template>
