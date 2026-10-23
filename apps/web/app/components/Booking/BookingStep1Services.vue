<script setup lang="ts">
import type { MasterService, MasterServiceGroup, ServiceCategory } from '#shared/types/master'

const { $ts } = useI18n()

const props = defineProps<{
  username: string
  categories?: ServiceCategory[]
  services?: MasterService[]
  loading?: boolean
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

function setServiceSelected(serviceId: string, selected: boolean | 'indeterminate') {
  const selectedIds = bookingState.value.selectedServiceIds
  const shouldSelect = selected === true

  if (shouldSelect && !selectedIds.includes(serviceId)) {
    bookingState.value.selectedServiceIds = [...selectedIds, serviceId]
    return
  }

  if (!shouldSelect && selectedIds.includes(serviceId)) {
    bookingState.value.selectedServiceIds = selectedIds.filter((id) => id !== serviceId)
  }
}

function toggleService(serviceId: string) {
  setServiceSelected(serviceId, !isSelected(serviceId))
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <p class="text-xs text-muted">
      {{ $ts('booking.steps.services.description') }}
    </p>

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
          indicator: 'rounded-lg bg-zinc-900',
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
          <UCard
            v-for="service in group.items"
            :key="service.id"
            role="checkbox"
            tabindex="0"
            :aria-checked="isSelected(service.id)"
            variant="outline"
            class="cursor-pointer transition"
            :class="
              isSelected(service.id)
                ? 'ring-2 ring-primary bg-(--ui-bg-elevated)'
                : 'hover:bg-(--ui-bg-muted)'
            "
            :ui="{ body: 'p-4 sm:p-4' }"
            @click="toggleService(service.id)"
            @keydown.enter.prevent="toggleService(service.id)"
            @keydown.space.prevent="toggleService(service.id)"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="size-3 shrink-0 rounded-full ring-4 ring-current/10"
                  :style="{ color: service.color, backgroundColor: service.color }"
                  aria-hidden="true"
                />
                <div class="flex min-w-0 flex-col gap-1">
                  <span class="truncate font-medium text-(--ui-text-highlighted)">
                    {{ service.name }}
                  </span>
                  <span class="text-sm text-(--ui-text-muted)">
                    {{ $ts('booking.service.duration', { duration: service.duration }) }}
                  </span>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-3">
                <span class="font-semibold text-primary whitespace-nowrap">
                  {{ formatPrice(service.price) }}
                </span>
                <UCheckbox
                  color="primary"
                  :model-value="isSelected(service.id)"
                  :aria-label="
                    $ts('booking.steps.services.toggleService', { service: service.name })
                  "
                  @click.stop
                  @update:model-value="(selected) => setServiceSelected(service.id, selected)"
                />
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </div>
  </section>
</template>
