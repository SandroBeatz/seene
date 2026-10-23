<script setup lang="ts">
const { $ts } = useI18n()

const audienceCards = computed(() => [
  {
    title: $ts('audience.cards.nails.title'),
    description: $ts('audience.cards.nails.description'),
    icon: 'i-lucide-hand',
    bgColor: 'bg-emerald-50'
  },
  {
    title: $ts('audience.cards.brows.title'),
    description: $ts('audience.cards.brows.description'),
    icon: 'i-lucide-eye',
    bgColor: 'bg-cyan-50'
  },
  {
    title: $ts('audience.cards.makeup.title'),
    description: $ts('audience.cards.makeup.description'),
    icon: 'i-lucide-sparkles',
    bgColor: 'bg-amber-50'
  },
  {
    title: $ts('audience.cards.pmu.title'),
    description: $ts('audience.cards.pmu.description'),
    icon: 'i-lucide-pen-line',
    bgColor: 'bg-red-50'
  }
])
</script>

<template>
  <UPageSection id="audience" :ui="{ root: 'py-14' }">
    <UContainer>
      <h2 class="text-3xl font-bold text-center mb-12">
        {{ $ts('audience.title') }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <template v-for="(card, i) in audienceCards" :key="i">
          <UPageCard
            :title="card.title"
            :description="card.description"
            :icon="card.icon"
            variant="soft"
            orientation="horizontal"
            :ui="{ root: `${card.bgColor} shadow-none` }"
          />
        </template>
      </div>
    </UContainer>
  </UPageSection>
</template>

<style scoped></style>
