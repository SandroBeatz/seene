<script setup lang="ts">
/** "Почему это важно": three costs of working from a notebook, in money. */
const items = ['noShow', 'silence', 'net'] as const
</script>

<template>
  <section class="border-b border-line">
    <div class="site-container flex flex-col gap-14 py-24">
      <div v-reveal class="flex max-w-[760px] flex-col gap-4">
        <div class="site-eyebrow">{{ $ts('money.eyebrow') }}</div>
        <h2 class="site-h2 text-ink">{{ $ts('money.title') }}</h2>
      </div>

      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] overflow-hidden rounded-[24px] border border-line"
      >
        <div
          v-for="(item, i) in items"
          :key="item"
          v-reveal="i"
          class="-mt-px -mr-px flex flex-col gap-3.5 border-t border-r border-line p-8"
        >
          <div
            class="font-display text-[56px] font-semibold tracking-[-0.04em] whitespace-nowrap text-brand"
          >
            {{ $ts(`money.${item}.value`) }}
          </div>
          <div class="text-[18px] font-semibold text-ink">{{ $ts(`money.${item}.title`) }}</div>
          <p class="m-0 text-[15px] leading-[1.55] text-ink-muted">
            {{ $ts(`money.${item}.text`) }}
          </p>
          <div v-if="item === 'noShow'" class="mt-auto text-[12px] text-[#6B6B72]">
            {{ $ts('money.noShow.note') }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
