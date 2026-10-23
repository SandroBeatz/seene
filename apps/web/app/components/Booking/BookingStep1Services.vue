<script setup lang="ts">
import type { MasterService, MasterServiceGroup, ServiceCategory } from '#shared/types/master'

const { $ts } = useI18n()

const props = defineProps<{
  username: string
  categories?: ServiceCategory[]
  services?: MasterService[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [serviceId: string]
}>()

const bookingState = useBookingState(props.username)

const { data: masterData } = useMasterData(() => props.username)
const { formatPrice } = useMasterFormat(() => masterData.value?.settings)

const showCategoryHeaders = computed(() => (props.categories?.length ?? 0) > 1)

const serviceGroups = computed<MasterServiceGroup[]>(() => {
  const services = props.services ?? []
  const categories = props.categories ?? []

  if (!showCategoryHeaders.value) {
    return [{ category: null, items: services }]
  }

  const groups: MasterServiceGroup[] = categories
    .map((category) => ({
      category,
      items: services.filter((service) => service.category_id === category.id)
    }))
    .filter((group) => group.items.length > 0)

  const uncategorized = services.filter((service) => service.category_id === null)
  if (uncategorized.length > 0) {
    groups.push({ category: null, items: uncategorized })
  }

  return groups
})

const ALL_CATEGORIES = 'all'
const UNCATEGORIZED = 'uncategorized'

const activeCategory = ref<string>(ALL_CATEGORIES)

function groupKey(group: MasterServiceGroup) {
  return group.category?.id ?? UNCATEGORIZED
}

const categoryTabs = computed(() => [
  { label: $ts('booking.steps.services.allCategories'), value: ALL_CATEGORIES },
  ...serviceGroups.value.map((group) => ({
    label: group.category?.name ?? $ts('booking.steps.services.otherCategory'),
    value: groupKey(group)
  }))
])

const visibleGroups = computed(() =>
  activeCategory.value === ALL_CATEGORIES
    ? serviceGroups.value
    : serviceGroups.value.filter((group) => groupKey(group) === activeCategory.value)
)

// Fall back to "All" if the selected category disappears (e.g. services reloaded).
watch(serviceGroups, (groups) => {
  if (
    activeCategory.value !== ALL_CATEGORIES &&
    !groups.some((group) => groupKey(group) === activeCategory.value)
  ) {
    activeCategory.value = ALL_CATEGORIES
  }
})

function isSelected(serviceId: string) {
  return bookingState.value.selectedServiceIds.includes(serviceId)
}

// One service per booking: a tap picks it and moves on to the time.
function select(serviceId: string) {
  if (!isSelected(serviceId)) {
    bookingState.value.selectedServiceIds = [serviceId]
    bookingState.value.selectedDate = null
    bookingState.value.selectedSlot = null
  }
  emit('select', serviceId)
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <div v-if="loading" class="flex flex-col gap-3" aria-hidden="true">
      <USkeleton v-for="index in 4" :key="index" class="h-24 w-full rounded-lg" />
    </div>

    <p v-else-if="!services?.length" class="py-8 text-center text-sm text-(--ui-text-muted)">
      {{ $ts('booking.steps.services.empty') }}
    </p>

    <div v-else class="flex flex-col gap-5">
      <UTabs
        v-if="showCategoryHeaders && categoryTabs.length > 2"
        v-model="activeCategory"
        :items="categoryTabs"
        :content="false"
        size="md"
        class="w-full"
        :ui="{
          list: 'overflow-x-auto rounded-xl [scrollbar-width:none]',
          indicator: 'rounded-lg bg-inverted',
          trigger: 'shrink-0 cursor-pointer rounded-lg px-3.5 py-2 whitespace-nowrap',
          label: 'overflow-visible'
        }"
      />

      <section v-for="group in visibleGroups" :key="groupKey(group)" class="flex flex-col gap-2">
        <h2
          v-if="showCategoryHeaders && activeCategory === ALL_CATEGORIES"
          class="px-1 text-xs font-semibold uppercase tracking-wide text-(--ui-text-muted)"
        >
          {{ group.category?.name ?? $ts('booking.steps.services.otherCategory') }}
        </h2>

        <div class="flex flex-col gap-2">
          <UButton
            v-for="service in group.items"
            :key="service.id"
            color="neutral"
            variant="outline"
            :aria-pressed="isSelected(service.id)"
            class="w-full rounded-[14px] p-4 text-start transition"
            :class="isSelected(service.id) ? 'bg-elevated ring-2 ring-primary' : 'bg-default'"
            @click="select(service.id)"
          >
            <span class="flex w-full items-center justify-between gap-4">
              <span class="flex min-w-0 flex-col gap-1">
                <span class="truncate font-medium text-highlighted">{{ service.name }}</span>
                <span class="text-sm font-normal text-muted">
                  {{ $ts('booking.service.duration', { duration: service.duration }) }}
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-2">
                <span class="font-mono font-semibold whitespace-nowrap text-highlighted">
                  {{
                    service.price_from
                      ? $ts('booking.service.priceFrom', { price: formatPrice(service.price) })
                      : formatPrice(service.price)
                  }}
                </span>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed" />
              </span>
            </span>
          </UButton>
        </div>
      </section>
    </div>
  </section>
</template>
