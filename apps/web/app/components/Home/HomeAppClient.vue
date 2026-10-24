<script setup lang="ts">
/** The app's client card with visit history ("AppClient" artboard). */
const { money, market } = useHomeMoney()

const works = ['#C9A79B', '#9C7067', '#D4B8AE', '#B5867B']
const history = [
  { key: 'visit1', price: [800, 55] },
  { key: 'visit2', price: [1300, 90] },
  { key: 'visit3', price: [800, 55] }
] as const
</script>

<template>
  <HomeAppPhone :label="$ts('app.client.label')" tab="clients">
    <div class="flex items-center justify-between px-4.5 pt-7.5">
      <UIcon name="i-lucide-chevron-left" class="size-5" />
      <span class="text-[12px] font-semibold text-ink-muted">{{ $ts('app.client.edit') }}</span>
    </div>
    <div class="flex items-center gap-3 px-4.5 pt-2.5">
      <div
        class="flex size-13 items-center justify-center rounded-full bg-brand-soft font-display text-[20px] font-bold text-brand-ink"
      >
        {{ $ts('app.client.name').charAt(0) }}
      </div>
      <div class="flex flex-col gap-0.5">
        <div class="font-display text-[20px] font-bold tracking-[-0.02em]">
          {{ $ts('app.client.name') }}
        </div>
        <div class="text-[11.5px] text-ink-muted">
          {{ $ts(market === 'ca' ? 'app.client.metaCa' : 'app.client.meta') }}
        </div>
      </div>
    </div>

    <div class="mx-3.5 mt-3.5 grid grid-cols-3 rounded-[14px] border border-[#EFEFEC]">
      <div class="flex flex-col gap-px px-2.5 py-[9px]">
        <span class="text-[15px] font-bold">14</span>
        <span class="text-[10px] text-ink-muted">{{ $ts('app.client.visits') }}</span>
      </div>
      <div class="flex flex-col gap-px border-l border-[#EFEFEC] px-2.5 py-[9px]">
        <span class="text-[15px] font-bold whitespace-nowrap">{{ money([920, 65]) }}</span>
        <span class="text-[10px] text-ink-muted">{{ $ts('app.client.average') }}</span>
      </div>
      <div class="flex flex-col gap-px border-l border-[#EFEFEC] px-2.5 py-[9px]">
        <span class="text-[15px] font-bold">{{ $ts('app.client.cycle') }}</span>
        <span class="text-[10px] text-ink-muted">{{ $ts('app.client.cycleLabel') }}</span>
      </div>
    </div>

    <div class="mx-3.5 mt-2.5 rounded-[12px] bg-surface px-3 py-2.5 text-[11.5px] leading-[1.45]">
      <span class="font-semibold">{{ $ts('app.client.noteLabel') }}</span>
      {{ $ts('app.client.note') }}
    </div>

    <div
      class="px-4.5 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase"
    >
      {{ $ts('app.client.works') }}
    </div>
    <div class="grid grid-cols-4 gap-1.5 px-3.5">
      <div
        v-for="color in works"
        :key="color"
        class="aspect-square rounded-[10px]"
        :style="{ background: color }"
      />
    </div>

    <div
      class="px-4.5 pt-3 pb-0.5 text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase"
    >
      {{ $ts('app.client.history') }}
    </div>
    <div class="flex flex-col px-4.5">
      <div
        v-for="(visit, i) in history"
        :key="visit.key"
        class="flex items-center justify-between py-2"
        :class="i < history.length - 1 ? 'border-b border-[#EFEFEC]' : ''"
      >
        <div class="flex flex-col gap-px">
          <span class="text-[12.5px] font-semibold">{{ $ts(`app.client.${visit.key}`) }}</span>
          <span class="text-[11px] text-ink-muted">{{ $ts(`app.client.${visit.key}Date`) }}</span>
        </div>
        <span class="text-[12.5px] font-semibold">{{ money(visit.price) }}</span>
      </div>
    </div>
  </HomeAppPhone>
</template>
