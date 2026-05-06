<script setup lang="ts">
import type { MasterService, MasterServiceGroup, ServiceCategory } from '#shared/types/master'

const props = defineProps<{
  categories?: ServiceCategory[]
  services?: MasterService[]
}>()

const showCategoryHeaders = computed(() => (props.categories?.length ?? 0) > 1)

const groups = computed<MasterServiceGroup[]>(() => {
  const items = props.services ?? []
  const cats = props.categories ?? []

  if (!showCategoryHeaders.value) {
    return [{ category: null, items }]
  }

  const grouped: MasterServiceGroup[] = cats
    .map((cat) => ({
      category: cat,
      items: items.filter((s) => s.category_id === cat.id)
    }))
    .filter((g) => g.items.length > 0)

  const uncategorised = items.filter((s) => s.category_id === null)
  if (uncategorised.length > 0) {
    grouped.push({ category: null, items: uncategorised })
  }

  return grouped
})
</script>

<template>
  <div class="flex flex-col">
    <p v-if="!services?.length" class="text-sm text-(--ui-text-muted) py-4 text-center">
      {{ $ts('master.services.empty') }}
    </p>

    <template v-for="group in groups" :key="group.category?.id ?? 'uncategorised'">
      <p
        v-if="group.category"
        class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted) pt-4 pb-1"
      >
        {{ group.category.name }}
      </p>

      <div v-for="(service, index) in group.items" :key="service.id">
        <div class="flex items-start justify-between gap-4 py-4">
          <div class="flex flex-col gap-1 min-w-0">
            <span class="font-medium text-(--ui-text-highlighted)">{{ service.name }}</span>
            <span v-if="service.description" class="text-sm text-(--ui-text-muted)">{{
              service.description
            }}</span>
            <span class="text-xs text-(--ui-text-subtle)"
              >{{ service.duration }} {{ $ts('master.services.duration') }}</span
            >
          </div>
          <span class="font-bold text-lg text-primary shrink-0 whitespace-nowrap">
            {{ service.price }} {{ $ts('master.services.currency_rub') }}
          </span>
        </div>
        <USeparator v-if="index < group.items.length - 1" />
      </div>
    </template>
  </div>
</template>
