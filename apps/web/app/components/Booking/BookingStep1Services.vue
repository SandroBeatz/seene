<script setup lang="ts">
import type { MasterPageData, MasterService } from '#shared/types/master'

const props = defineProps<{
  data: MasterPageData
}>()

defineEmits<{
  next: []
}>()

const { $ts } = useI18n()
const bookingState = useBookingState(props.data.profile.username)
const { formatPrice } = useMasterFormat(() => props.data.settings)
const { formatDuration } = useMasterPageFormat(() => props.data.settings)

const services = computed(() => props.data.services.filter((s) => s.show_online))

function isSelected(id: string) {
  return bookingState.value.selectedServiceIds.includes(id)
}

// Several services can go into one visit; a new set of services means new times.
function toggle(id: string) {
  const ids = bookingState.value.selectedServiceIds
  bookingState.value.selectedServiceIds = isSelected(id)
    ? ids.filter((item) => item !== id)
    : [...ids, id]
  bookingState.value.selectedSlot = null
}

function priceLabel(service: MasterService) {
  const price = formatPrice(service.price)
  return service.price_from ? $ts('booking.service.priceFrom', { price }) : price
}
</script>

<template>
  <section class="flex flex-1 flex-col">
    <div class="seene-reveal flex flex-col gap-2.5 px-4 pt-2">
      <h1
        class="mx-1 mb-1.5 font-display text-[26px] font-bold tracking-[-0.03em] text-highlighted"
      >
        {{ $ts('booking.steps.services.title') }}
      </h1>

      <p v-if="!services.length" class="py-8 text-center text-sm text-muted">
        {{ $ts('booking.steps.services.empty') }}
      </p>

      <button
        v-for="service in services"
        :key="service.id"
        type="button"
        :aria-pressed="isSelected(service.id)"
        class="flex items-center gap-3 rounded-[18px] p-3 text-start text-highlighted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="
          isSelected(service.id)
            ? 'border-2 border-primary bg-(--seene-accent-soft) p-[11px]'
            : 'border border-default bg-elevated'
        "
        @click="toggle(service.id)"
      >
        <BookingThumb :service="service" class="size-13 rounded-[12px] text-lg" />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="text-[15px] leading-snug font-semibold">{{ service.name }}</span>
          <span class="text-[13px] text-muted">{{ formatDuration(service.duration) }}</span>
        </span>
        <span class="flex shrink-0 flex-col items-end gap-1.5">
          <span class="text-[15px] font-semibold whitespace-nowrap">{{ priceLabel(service) }}</span>
          <span
            class="flex size-5.5 items-center justify-center rounded-full"
            :class="isSelected(service.id) ? 'bg-primary text-inverted' : 'border-2 border-default'"
            aria-hidden="true"
          >
            <UIcon v-if="isSelected(service.id)" name="i-lucide-check" class="size-3" />
          </span>
        </span>
      </button>
      <div class="h-2" />
    </div>

    <BookingFooter
      :label="$ts('booking.header.next')"
      :disabled="!bookingState.selectedServiceIds.length"
      @click="$emit('next')"
    />
  </section>
</template>
