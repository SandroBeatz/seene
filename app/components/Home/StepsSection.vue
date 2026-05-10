<script setup lang="ts">
const { $ts } = useI18n()

const howSteps = computed(() => [
  { num: 1, title: $ts('steps.step1.title'), description: $ts('steps.step1.description') },
  { num: 2, title: $ts('steps.step2.title'), description: $ts('steps.step2.description') },
  { num: 3, title: $ts('steps.step3.title'), description: $ts('steps.step3.description') },
  { num: 4, title: $ts('steps.step4.title'), description: $ts('steps.step4.description') }
])
</script>

<template>
  <UPageSection id="steps" :ui="{ root: 'bg-muted', container: 'py-16!' }">
    <h2
      class="text-2xl font-bold text-center text-highlighted mb-14"
    >
      {{ $ts('steps.title') }}
    </h2>
    <div class="grid grid-cols-4 gap-8">
      <template v-for="(step, i) in howSteps" :key="i">
        <UPageFeature orientation="vertical" :title="step.title" :description="step.description">
          <template #leading>
            <div
              class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-inverted font-bold text-lg mb-4 z-10"
            >
              {{ step.num }}
            </div>
          </template>
        </UPageFeature>
      </template>
    </div>
  </UPageSection>
</template>
