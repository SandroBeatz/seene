<script setup lang="ts">
/**
 * "Страница мастера" (#booking): the four steps of online booking; the step
 * that is on shows its screen in the phone. Wide screens: the list of steps on
 * the left, the phone on the right. Phones and tablets: tabs, the chosen step's
 * text, then the phone. The design's "See an example page" link waits for a
 * demo master page.
 */
const { $ts } = useI18n()

const steps = ['page', 'services', 'time', 'done'] as const

const active = ref(0)
const current = computed(() => steps[active.value]!)
const tabs = computed(() => steps.map((step) => $ts(`booking.${step}.tab`)))
</script>

<template>
  <section id="booking" class="scroll-mt-(--ui-header-height) border-b border-line bg-paper">
    <div class="site-container flex flex-col gap-8 py-24 lg:flex-row lg:items-center lg:gap-14">
      <div class="flex min-w-0 flex-col gap-7 lg:flex-[1_1_460px]">
        <div v-reveal class="flex flex-col gap-4">
          <div class="site-eyebrow">{{ $ts('booking.eyebrow') }}</div>
          <h2 class="site-h2 text-ink">{{ $ts('booking.title') }}</h2>
          <p class="m-0 text-[17px] leading-[1.6] text-ink-muted">{{ $ts('booking.text') }}</p>
        </div>

        <!-- Phones and tablets: tabs and the chosen step -->
        <div v-reveal="1" class="flex flex-col gap-5 lg:hidden">
          <HomeShowcaseTabs v-model="active" :labels="tabs" on="paper" />
          <div :key="current" class="site-rise flex flex-col gap-2">
            <h3 class="m-0 font-display text-[22px] font-semibold tracking-[-0.015em] text-ink">
              {{ $ts(`booking.${current}.title`) }}
            </h3>
            <p class="m-0 text-[15px] leading-[1.55] text-ink-muted">
              {{ $ts(`booking.${current}.text`) }}
            </p>
          </div>
        </div>

        <!-- Wide screens: the list of steps -->
        <div v-reveal="1" class="hidden flex-col gap-2 lg:flex">
          <HomeShowcaseItem
            v-for="(step, i) in steps"
            :key="step"
            :index="i"
            numbering="step"
            :title="$ts(`booking.${step}.title`)"
            :text="$ts(`booking.${step}.text`)"
            :active="active === i"
            @select="active = i"
          />
        </div>
      </div>

      <div v-reveal="2" class="flex min-w-0 justify-center lg:flex-[1_1_360px]">
        <div :key="active" class="site-rise">
          <HomeBookingPhone :screen="current" />
        </div>
      </div>
    </div>
  </section>
</template>
