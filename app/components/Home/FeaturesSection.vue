<script setup lang="ts">
const { $ts } = useI18n()

const featuresSection = ref<HTMLElement>()
const { isVisible: featuresVisible } = useScrollReveal(featuresSection)

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
    color: '#f59e0b',
    featured: true
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
  <section id="features" ref="featuresSection" class="py-20 px-4 bg-[var(--section-bg-white)]">
    <div class="max-w-5xl mx-auto">
      <h2
        class="text-2xl font-bold text-center text-[var(--color-heading)] mb-12 transition-all duration-700"
        :class="featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{ $ts('features.title') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(card, i) in featureCards"
          :key="i"
          class="rounded-3xl bg-[var(--ui-bg-elevated)] shadow-lg shadow-black/5 ring-1 ring-[var(--ui-border-muted)] transition-all dark:shadow-black/30"
          :class="[
            featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            card.featured ? 'border border-amber-500/30' : ''
          ]"
          :style="{ padding: '32px', transitionDelay: `${i * 100}ms`, transitionDuration: '600ms' }"
        >
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            :style="{ background: card.color + '1a' }"
          >
            <UIcon :name="card.icon" class="w-6 h-6" :style="{ color: card.color }" />
          </div>
          <h3 class="text-base font-semibold text-[var(--ui-text-highlighted)] mb-2">
            {{ card.title }}
          </h3>
          <p class="text-sm text-[var(--ui-text-muted)]">{{ card.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
