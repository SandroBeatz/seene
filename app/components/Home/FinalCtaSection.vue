<script setup lang="ts">
const config = useRuntimeConfig()
const { $ts } = useI18n()

const ctaSection = ref<HTMLElement>()
const { isVisible: ctaVisible } = useScrollReveal(ctaSection)
</script>

<template>
  <section id="start" ref="ctaSection" class="py-24 px-4 bg-amber-500">
    <div
      class="max-w-3xl mx-auto text-center transition-all duration-700"
      :class="ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
    >
      <h2 class="font-bold text-white mb-8" style="font-size: 2.2rem; line-height: 1.2">
        {{ $ts('finalCta.title') }}
      </h2>
      <UButton
        :to="config.public.dashboardUrl"
        :label="$ts('finalCta.button')"
        size="xl"
        class="rounded-3xl mb-4"
        :ui="{ base: 'bg-white! text-neutral-900! hover:bg-white/90!' }"
      />
      <p class="text-sm" style="color: rgba(255, 255, 255, 0.7)">{{ $ts('finalCta.microtext') }}</p>
    </div>
  </section>
</template>
