<script setup lang="ts">
const { $ts } = useI18n()

const stepsSection = ref<HTMLElement>()
const { isVisible: stepsVisible } = useScrollReveal(stepsSection)

const howSteps = computed(() => [
  { num: 1, title: $ts('steps.step1.title'), description: $ts('steps.step1.description') },
  { num: 2, title: $ts('steps.step2.title'), description: $ts('steps.step2.description') },
  { num: 3, title: $ts('steps.step3.title'), description: $ts('steps.step3.description') },
  { num: 4, title: $ts('steps.step4.title'), description: $ts('steps.step4.description') }
])
</script>

<template>
  <section id="steps" ref="stepsSection" class="py-20 px-4 bg-[var(--section-bg-warm)]">
    <div class="max-w-5xl mx-auto">
      <h2
        class="text-2xl font-bold text-center text-[var(--color-heading)] mb-14 transition-all duration-700"
        :class="stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{ $ts('steps.title') }}
      </h2>
      <div class="flex flex-col lg:flex-row gap-8">
        <div
          v-for="(step, i) in howSteps"
          :key="i"
          class="flex-1 flex flex-col items-center text-center transition-all"
          :class="stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          :style="{ transitionDelay: `${i * 150}ms`, transitionDuration: '600ms' }"
        >
          <div
            class="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-lg mb-4 z-10"
          >
            {{ step.num }}
          </div>
          <h3 class="text-base font-semibold text-[var(--ui-text-highlighted)] mb-2">
            {{ step.title }}
          </h3>
          <p class="text-sm text-[var(--ui-text-muted)]">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
