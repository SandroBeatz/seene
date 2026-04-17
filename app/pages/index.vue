<script setup lang="ts">
const { $t, $localePath } = useI18n()

const cards = computed(() => [
  {
    title: $t('features.cards.nails'),
    description: $t('features.cards.nailsDesc'),
    icon: 'i-lucide-hand',
    to: $localePath('/for/nail-masters')
  },
  {
    title: $t('features.cards.brows'),
    description: $t('features.cards.browsDesc'),
    icon: 'i-lucide-eye',
    to: $localePath('/for/brow-artists')
  },
  {
    title: $t('features.cards.lashes'),
    description: $t('features.cards.lashesDesc'),
    icon: 'i-lucide-eye',
    to: $localePath('/for/lash-makers')
  },
  {
    title: $t('features.cards.makeup'),
    description: $t('features.cards.makeupDesc'),
    icon: 'i-lucide-sparkles',
    to: $localePath('/for/makeup-artists')
  },
  {
    title: $t('features.cards.pmu'),
    description: $t('features.cards.pmuDesc'),
    icon: 'i-lucide-pen-line',
    to: $localePath('/for/pmu-masters')
  }
])

const steps = computed(() => [
  { icon: 'i-lucide-rocket', title: $t('steps.register') },
  { icon: 'i-lucide-rocket', title: $t('steps.setup') },
  { icon: 'i-lucide-rocket', title: $t('steps.share') }
])

const heroLinks = computed(() => [
  {
    label: $t('hero.cta'),
    to: $localePath('/signup'),
    color: 'primary' as const,
    size: 'xl' as const
  }
])

const ctaLinks = computed(() => [
  {
    label: $t('cta.start'),
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
      :title="$t('hero.title')"
      :description="$t('hero.description')"
      orientation="horizontal"
      :links="heroLinks"
    >
      <img
        src="~/assets/img/hero.png"
        :alt="$t('hero.imageAlt')"
        class="w-full max-w-lg rounded-2xl shadow-xl"
      />
    </UPageHero>

    <UPageSection
      id="features"
      :title="$t('features.title')"
    >
      <UPageGrid>
        <UPageCard v-for="(card, index) in cards" :key="index" v-bind="card" />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      id="steps"
      :title="$t('steps.title')"
      :features="steps"
    />

    <UPageSection>
      <UPageCTA
        :title="$t('cta.title')"
        :description="$t('cta.description')"
        variant="subtle"
        :links="ctaLinks"
      />
    </UPageSection>
  </div>
</template>
