<script setup lang="ts">
const { $ts } = useI18n()

const faqSection = ref<HTMLElement>()
const { isVisible: faqVisible } = useScrollReveal(faqSection)

const faqItems = computed(() => [
  { label: $ts('faq.q1.question'), content: $ts('faq.q1.answer') },
  { label: $ts('faq.q2.question'), content: $ts('faq.q2.answer') },
  { label: $ts('faq.q3.question'), content: $ts('faq.q3.answer') },
  { label: $ts('faq.q4.question'), content: $ts('faq.q4.answer') },
  { label: $ts('faq.q5.question'), content: $ts('faq.q5.answer') }
])
</script>

<template>
  <section id="faq" ref="faqSection" class="py-20 px-4 bg-[var(--section-bg-white)]">
    <div class="max-w-2xl mx-auto">
      <h2
        class="text-2xl font-bold text-center text-[var(--color-heading)] mb-10 transition-all duration-700"
        :class="faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{ $ts('faq.title') }}
      </h2>
      <div
        class="transition-all duration-700"
        :class="faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        style="transition-delay: 100ms"
      >
        <UAccordion :items="faqItems" />
      </div>
    </div>
  </section>
</template>
