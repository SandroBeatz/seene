<script setup lang="ts">
/**
 * "Страница мастера" (#booking): the four steps of online booking; the step
 * that is on shows its screen in the phone. The design's "See an example page"
 * link waits for a demo master page.
 */
const steps = [
  { key: 'page', screen: 'page' },
  { key: 'services', screen: 'services' },
  { key: 'time', screen: 'time' },
  { key: 'done', screen: 'done' }
] as const

const active = ref(0)
</script>

<template>
  <section id="booking" class="scroll-mt-(--ui-header-height) border-b border-line bg-paper">
    <div class="site-container flex flex-wrap items-center gap-14 py-24">
      <div class="flex min-w-0 flex-[1_1_460px] flex-col gap-7">
        <div v-reveal class="flex flex-col gap-4">
          <div class="site-eyebrow">{{ $ts('booking.eyebrow') }}</div>
          <h2 class="site-h2 text-ink">{{ $ts('booking.title') }}</h2>
          <p class="m-0 text-[17px] leading-[1.6] text-ink-muted">{{ $ts('booking.text') }}</p>
        </div>

        <div v-reveal="1" class="flex flex-col gap-2">
          <HomeShowcaseItem
            v-for="(step, i) in steps"
            :key="step.key"
            :index="i"
            numbering="step"
            :title="$ts(`booking.${step.key}.title`)"
            :text="$ts(`booking.${step.key}.text`)"
            :active="active === i"
            @select="active = i"
          />
        </div>
      </div>

      <div v-reveal="2" class="flex min-w-0 flex-[1_1_360px] justify-center">
        <div :key="active" class="site-rise">
          <HomeBookingPhone :screen="steps[active]!.screen" />
        </div>
      </div>
    </div>
  </section>
</template>
