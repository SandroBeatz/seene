<script setup lang="ts">
const { $ts } = useI18n()

const faqItems = computed(() => [
  { label: $ts('faq.q1.question'), content: $ts('faq.q1.answer') },
  { label: $ts('faq.q2.question'), content: $ts('faq.q2.answer') },
  { label: $ts('faq.q3.question'), content: $ts('faq.q3.answer') },
  { label: $ts('faq.q4.question'), content: $ts('faq.q4.answer') },
  { label: $ts('faq.q5.question'), content: $ts('faq.q5.answer') }
])
</script>

<template>
  <UPageSection id="faq" :ui="{ container: 'md:max-w-3xl' }">
    <h2 class="text-2xl font-bold text-center text-highlighted">
      {{ $ts('faq.title') }}
    </h2>
    <UAccordion :items="faqItems" />
  </UPageSection>
</template>
