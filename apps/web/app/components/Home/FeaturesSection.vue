<script setup lang="ts">
const { $ts } = useI18n()

const featureCards = computed(() => [
  {
    title: $ts('features.booking.title'),
    description: $ts('features.booking.description'),
    icon: 'i-lucide-calendar-check',
    color: '#f87171',
    featured: false
  },
  {
    title: $ts('features.calendar.title'),
    description: $ts('features.calendar.description'),
    icon: 'i-lucide-calendar',
    color: '#60a5fa',
    featured: false
  },
  {
    title: $ts('features.services.title'),
    description: $ts('features.services.description'),
    icon: 'i-lucide-scissors',
    color: '#4ade80',
    featured: false
  },
  {
    title: $ts('features.clients.title'),
    description: $ts('features.clients.description'),
    icon: 'i-lucide-users',
    color: '#a78bfa',
    featured: false
  },
  {
    title: $ts('features.reminders.title'),
    description: $ts('features.reminders.description'),
    icon: 'i-lucide-bell',
    color: '#ff868f',
    featured: false
  },
  {
    title: $ts('features.stats.title'),
    description: $ts('features.stats.description'),
    icon: 'i-lucide-bar-chart-2',
    color: '#fb923c',
    featured: false
  }
])
</script>

<template>
  <UPageSection id="features">
    <h2 class="text-2xl font-bold text-center text-highlighted mb-12 transition-all duration-700">
      {{ $ts('features.title') }}
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-for="(card, i) in featureCards" :key="i">
        <UPageCard
          :title="card.title"
          :description="card.description"
          spotlight
          spotlight-color="info"
          variant="ghost"
        >
          <template #leading>
            <div
              class="w-12 h-12 rounded-md flex items-center justify-center"
              :style="{ background: card.color + '1a' }"
            >
              <UIcon :name="card.icon" class="w-6 h-6" :style="{ color: card.color }" />
            </div>
          </template>
        </UPageCard>
      </template>
    </div>
  </UPageSection>
</template>
