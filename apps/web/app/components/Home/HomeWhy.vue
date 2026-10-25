<script setup lang="ts">
/** "Почему мастера выбирают Seene": four reasons under a black rule. */
const reasons = ['noShows', 'return', 'commission', 'simple'] as const
</script>

<template>
  <section class="border-b border-line">
    <div class="site-container flex flex-col gap-10 py-24">
      <div v-reveal class="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div class="flex max-w-[700px] flex-col gap-4">
          <div class="site-eyebrow">{{ $ts('why.eyebrow') }}</div>
          <h2 class="site-h2 text-ink">{{ $ts('why.title') }}</h2>
        </div>
        <NuxtLink
          :to="$localePath('/calculator')"
          class="text-[15px] font-semibold text-ink underline underline-offset-4 hover:text-ink-muted"
        >
          {{ $ts('why.calculator') }}
        </NuxtLink>
      </div>

      <div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-6">
        <div
          v-for="(reason, i) in reasons"
          :key="reason"
          v-reveal="i"
          class="flex flex-col gap-2.5 border-t-2 border-ink p-7"
        >
          <h3 class="m-0 text-[19px] font-semibold tracking-[-0.01em] text-ink">
            {{ $ts(`why.${reason}.title`) }}
          </h3>
          <p class="m-0 text-[15px] leading-[1.55] text-ink-muted">
            {{ $ts(`why.${reason}.text`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
