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
    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-semibold text-(--ui-text-highlighted)">
        {{ $ts('booking.steps.services.title') }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ $ts('booking.steps.services.description') }}
      </p>
    </div>

    <div v-if="loading" class="flex flex-col gap-3" aria-hidden="true">
      <USkeleton v-for="index in 4" :key="index" class="h-24 w-full rounded-lg" />
    </div>

    <p v-else-if="!services?.length" class="py-8 text-center text-sm text-(--ui-text-muted)">
      {{ $ts('booking.steps.services.empty') }}
    </p>

    <div v-else class="flex flex-col gap-5">
      <section
        v-for="group in serviceGroups"
        :key="group.category?.id ?? 'uncategorized'"
        class="flex flex-col gap-2"
      >
        <h2
          v-if="showCategoryHeaders"
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
                  {{ $ts('booking.service.price', { price: service.price }) }}
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
