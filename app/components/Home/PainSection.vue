<script setup lang="ts">
const { $ts } = useI18n()

const painSection = ref<HTMLElement>()
const { isVisible: painVisible } = useScrollReveal(painSection)

const painBubbles = computed(() => [
  $ts('pain.bubbles.time'),
  $ts('pain.bubbles.direct'),
  $ts('pain.bubbles.reminder')
])
</script>

<template>
  <section id="pain" ref="painSection" class="py-20 px-4 bg-[var(--section-bg-dark)]">
    <div class="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
      <div
        class="flex-1 transition-all duration-700"
        :class="painVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <h2 class="font-bold text-white mb-4" style="font-size: 2rem; line-height: 1.25">
          {{ $ts('pain.title') }}
        </h2>
        <p class="text-base leading-relaxed" style="color: rgba(235, 235, 235, 0.64)">
          {{ $ts('pain.description') }}
        </p>
      </div>
      <div class="flex-1 flex flex-col gap-3 w-full max-w-sm">
        <div
          v-for="(bubble, i) in painBubbles"
          :key="i"
          class="rounded-2xl transition-all"
          :class="painVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
          :style="{
            background: 'rgba(39,39,42,0.8)',
            padding: '12px 16px',
            color: 'rgba(235,235,235,0.8)',
            transitionDelay: `${i * 300}ms`,
            transitionDuration: '500ms'
          }"
        >
          {{ bubble }}
        </div>
      </div>
    </div>
  </section>
</template>
