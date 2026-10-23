<script setup lang="ts">
import type { PricingPlanProps } from '@nuxt/ui'

const { $ts } = useI18n()

const plans = ref<PricingPlanProps[]>([
  {
    title: $ts('pricing.free.name'),
    description: 'Best suited for small teams.',
    price: $ts('pricing.free.price'),
    features: [
      $ts('pricing.free.feature1'),
      $ts('pricing.free.feature2'),
      $ts('pricing.free.feature3'),
      $ts('pricing.free.feature4')
    ],
    button: {
      label: $ts('pricing.free.cta')
    }
  },
  {
    highlight: true,
    title: $ts('pricing.pro.name'),
    description: 'Ideal for larger teams and organizations.',
    price: $ts('pricing.pro.price'),
    badge: $ts('pricing.pro.badge'),
    billingCycle: $ts('pricing.pro.period'),
    features: [
      $ts('pricing.pro.feature1'),
      $ts('pricing.pro.feature2'),
      $ts('pricing.pro.feature3'),
      $ts('pricing.pro.feature4'),
      $ts('pricing.pro.feature5'),
      $ts('pricing.pro.feature6')
    ],
    button: {
      label: $ts('pricing.pro.cta')
    }
  }
])
</script>

<template>
  <UPageSection id="pricing" :ui="{ root: 'bg-muted' }">
    <h2 class="text-2xl font-bold text-center text-highlighted">
      {{ $ts('pricing.title') }}
    </h2>

    <UPricingPlans :plans="plans" />
  </UPageSection>
</template>
