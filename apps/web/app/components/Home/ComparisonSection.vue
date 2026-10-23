<script setup lang="ts">
const { $ts } = useI18n()

const comparisonRows = computed(() => [
  { crm: $ts('comparison.rows.setup.crm'), seene: $ts('comparison.rows.setup.seene') },
  { crm: $ts('comparison.rows.payment.crm'), seene: $ts('comparison.rows.payment.seene') },
  { crm: $ts('comparison.rows.manager.crm'), seene: $ts('comparison.rows.manager.seene') },
  { crm: $ts('comparison.rows.interface.crm'), seene: $ts('comparison.rows.interface.seene') },
  { crm: $ts('comparison.rows.price.crm'), seene: $ts('comparison.rows.price.seene') }
])
</script>

<template>
  <UPageSection id="comparison" :ui="{ root: 'bg-inverted' }">
    <h2 class="text-2xl font-bold text-center text-white mb-10">
      {{ $ts('comparison.title') }}
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <UCard
        :ui="{
          root: 'bg-neutral-800 ring-neutral-600 divide-neutral-600',
          body: 'p-0!'
        }"
      >
        <template #header>
          <p class="text-sm font-semibold text-neutral-300">
            {{ $ts('comparison.crmHeader') }}
          </p>
        </template>
        <template #default>
          <div
            v-for="(row, i) in comparisonRows"
            :key="i"
            class="flex items-center gap-3 px-6 py-5 text-neutral-300 border-b border-neutral-600 last:border-0"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4 flex-shrink-0 text-red-400" />
            <span class="text-sm">{{ row.crm }}</span>
          </div>
        </template>
      </UCard>
      <UCard
        :ui="{
          root: 'bg-violet-800/10 ring-violet-800/60 divide-violet-800/60',
          body: 'p-0!'
        }"
      >
        <template #header>
          <p class="text-sm font-semibold text-neutral-300">Seene</p>
        </template>
        <template #default>
          <div
            v-for="(row, i) in comparisonRows"
            :key="i"
            class="flex items-center gap-3 px-6 py-5 text-neutral-300 border-b border-neutral-600 last:border-0"
          >
            <UIcon name="i-lucide-check" class="w-4 h-4 flex-shrink-0 text-green-400" />
            <span class="text-sm">{{ row.seene }}</span>
          </div>
        </template>
      </UCard>
    </div>
  </UPageSection>
</template>
