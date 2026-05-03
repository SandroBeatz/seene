<script setup lang="ts">
const { $ts } = useI18n()

const audienceSection = ref<HTMLElement>()
const { isVisible: audienceVisible } = useScrollReveal(audienceSection)

const audienceCards = computed(() => [
  {
    title: $ts('audience.cards.nails.title'),
    description: $ts('audience.cards.nails.description'),
    icon: 'i-lucide-hand'
  },
  {
    title: $ts('audience.cards.brows.title'),
    description: $ts('audience.cards.brows.description'),
    icon: 'i-lucide-eye'
  },
  {
    title: $ts('audience.cards.makeup.title'),
    description: $ts('audience.cards.makeup.description'),
    icon: 'i-lucide-sparkles'
  },
  {
    title: $ts('audience.cards.pmu.title'),
    description: $ts('audience.cards.pmu.description'),
    icon: 'i-lucide-pen-line'
  }
])
</script>

<template>
  <section id="audience" ref="audienceSection" class="py-20 px-4 bg-[var(--section-bg-white)]">
    <div class="max-w-5xl mx-auto">
      <h2
        class="text-2xl font-bold text-center text-[var(--color-heading)] mb-12 transition-all duration-700"
        :class="audienceVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{ $ts('audience.title') }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div
          v-for="(card, i) in audienceCards"
          :key="i"
          class="audience-card rounded-3xl bg-[var(--ui-bg-elevated)] shadow-lg shadow-black/5 ring-1 ring-[var(--ui-border-muted)] transition-all dark:shadow-black/30"
          :class="audienceVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          :style="{ padding: '28px', transitionDelay: `${i * 100}ms`, transitionDuration: '600ms' }"
        >
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style="background: rgba(245, 158, 11, 0.12)"
          >
            <UIcon :name="card.icon" class="w-5 h-5 text-amber-500" />
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

<style scoped>
.audience-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}
</style>
