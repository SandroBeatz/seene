<script setup lang="ts">
/** "Возможности" (#features): four columns of what the app does. */
const groups = ['booking', 'calendar', 'clients', 'assistant'] as const
const points = ['p1', 'p2', 'p3', 'p4'] as const
</script>

<template>
  <section id="features" class="scroll-mt-(--ui-header-height) border-b border-line bg-paper">
    <div class="site-container flex flex-col gap-12 py-24">
      <div v-reveal class="flex max-w-[760px] flex-col gap-4">
        <div class="site-eyebrow">{{ $ts('features.eyebrow') }}</div>
        <h2 class="site-h2 text-ink">{{ $ts('features.title') }}</h2>
      </div>

      <div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
        <div
          v-for="(group, i) in groups"
          :key="group"
          v-reveal="i"
          class="flex flex-col gap-3.5 border-t-2 border-ink pt-5"
        >
          <h3 class="m-0 text-xl font-semibold tracking-[-0.02em] text-ink">
            {{ $ts(`features.${group}.title`) }}
          </h3>
          <ul class="m-0 flex list-none flex-col gap-3.5 p-0">
            <li
              v-for="point in points"
              :key="point"
              class="flex gap-2.5 text-[15px] leading-[1.45] text-ink"
            >
              <UIcon name="i-lucide-check" class="mt-0.5 size-4.5 shrink-0" />
              {{ $ts(`features.${group}.${point}`) }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
