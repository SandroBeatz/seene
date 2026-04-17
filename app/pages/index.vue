<script setup lang="ts">
const { $ts, $localePath } = useI18n()

const cards = computed(() => [
  {
    title: $ts('features.cards.nails'),
    description: $ts('features.cards.nailsDesc'),
    icon: 'i-lucide-hand',
    to: $localePath('/for/nail-masters')
  },
  {
    title: $ts('features.cards.brows'),
    description: $ts('features.cards.browsDesc'),
    icon: 'i-lucide-eye',
    to: $localePath('/for/brow-artists')
  },
  {
    title: $ts('features.cards.lashes'),
    description: $ts('features.cards.lashesDesc'),
    icon: 'i-lucide-eye',
    to: $localePath('/for/lash-makers')
  },
  {
    title: $ts('features.cards.makeup'),
    description: $ts('features.cards.makeupDesc'),
    icon: 'i-lucide-sparkles',
    to: $localePath('/for/makeup-artists')
  },
  {
    title: $ts('features.cards.pmu'),
    description: $ts('features.cards.pmuDesc'),
    icon: 'i-lucide-pen-line',
    to: $localePath('/for/pmu-masters')
  }
])

const steps = computed(() => [
  { icon: 'i-lucide-rocket', title: $ts('steps.register') },
  { icon: 'i-lucide-rocket', title: $ts('steps.setup') },
  { icon: 'i-lucide-rocket', title: $ts('steps.share') }
])

const heroLinks = computed(() => [
  {
    label: $ts('hero.cta'),
    to: $localePath('/signup'),
    color: 'primary' as const,
    size: 'xl' as const
  }
])

const ctaLinks = computed(() => [
  {
    label: $ts('cta.start'),
    to: $localePath('/signup'),
    trailingIcon: 'i-lucide-arrow-right',
    color: 'primary' as const,
    size: 'xl' as const
  }
])
</script>

<template>
  <div>
    <UPageHero
      :title="$ts('hero.title')"
      :description="$ts('hero.description')"
      orientation="horizontal"
      :links="heroLinks"
    >
      <img
        src="~/assets/img/hero.png"
        :alt="$ts('hero.imageAlt')"
        class="w-full max-w-lg rounded-2xl shadow-xl"
      />
    </UPageHero>

    <UPageSection id="features" :title="$ts('features.title')">
      <UPageGrid>
        <UPageCard v-for="(card, index) in cards" :key="index" v-bind="card" />
      </UPageGrid>
    </UPageSection>

    <UPageSection id="steps" :title="$ts('steps.title')" :features="steps" />

    <UPageSection>
      <UPageCTA
        :title="$ts('cta.title')"
        :description="$ts('cta.description')"
        variant="subtle"
        :links="ctaLinks"
      />
    </UPageSection>
  </div>
</template>
