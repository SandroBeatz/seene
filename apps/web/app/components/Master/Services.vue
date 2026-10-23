<script setup lang="ts">
import type { MasterPageData, MasterService, MasterServiceGroup } from '#shared/types/master'

const props = defineProps<{
  data: MasterPageData
  bookingEnabled: boolean
}>()

defineEmits<{
  book: [serviceId: string]
}>()

const { $ts } = useI18n()
const { formatPrice } = useMasterFormat(() => props.data.settings)
const { formatDuration } = useMasterPageFormat(() => props.data.settings)

/** Categories appear only when the list gets long. */
const GROUP_THRESHOLD = 6

const groups = computed<MasterServiceGroup[]>(() => {
  const { services, categories } = props.data

  if (services.length <= GROUP_THRESHOLD || categories.length < 2) {
    return [{ category: null, items: services }]
  }

  const grouped: MasterServiceGroup[] = categories
    .map((category) => ({
      category,
      items: services.filter((s) => s.category_id === category.id)
    }))
    .filter((g) => g.items.length)

  const other = services.filter(
    (s) => !s.category_id || !categories.some((c) => c.id === s.category_id)
  )
  if (other.length) grouped.push({ category: null, items: other })

  return grouped
})

const showHeaders = computed(() => groups.value.length > 1)

function priceLabel(service: MasterService) {
  const price = formatPrice(service.price)
  return service.price_from ? $ts('master.services.priceFrom', { price }) : price
}
</script>

<template>
  <section
    v-if="data.services.length"
    aria-labelledby="master-services"
    class="flex flex-col gap-1.5"
  >
    <h2
      id="master-services"
      class="mb-2 font-display text-xl font-bold tracking-tight text-highlighted"
    >
      {{ $ts('master.services.title') }}
    </h2>

    <div v-for="group in groups" :key="group.category?.id ?? 'other'">
      <h3
        v-if="showHeaders"
        class="pt-4 pb-1 text-xs font-semibold tracking-wider text-muted uppercase"
      >
        {{ group.category?.name ?? $ts('master.services.other') }}
      </h3>

      <ul>
        <li
          v-for="service in group.items"
          :key="service.id"
          class="flex items-center gap-3.5 border-b border-default py-3"
        >
          <img
            v-if="service.photo_url"
            :src="service.photo_url"
            alt=""
            loading="lazy"
            decoding="async"
            class="size-14 shrink-0 rounded-[14px] object-cover"
          />
          <span
            v-else
            class="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-(--seene-accent-soft) font-display text-lg font-bold text-(--seene-accent-text)"
            aria-hidden="true"
          >
            {{ service.name.charAt(0).toUpperCase() }}
          </span>

          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <p class="text-[15px] leading-snug font-semibold text-highlighted">
              {{ service.name }}
            </p>
            <p class="text-[13px] text-muted">
              {{ formatDuration(service.duration) }} · {{ priceLabel(service) }}
            </p>
          </div>

          <UButton
            v-if="bookingEnabled && service.show_online"
            color="neutral"
            variant="outline"
            size="sm"
            :label="$ts('master.services.book')"
            :aria-label="$ts('master.services.bookAria', { name: service.name })"
            class="shrink-0 rounded-full px-3.5 font-semibold"
            @click="$emit('book', service.id)"
          />
        </li>
      </ul>
    </div>
  </section>
</template>
