<script setup lang="ts">
/** The app's "Money" screen: net, income, expenses ("AppMoney" artboard). */
const { $ts } = useI18n()
const { money } = useHomeMoney()

const heights = [62, 78, 70, 92]
const weeks = computed(() =>
  $ts('app.money.weeks')
    .split(',')
    .map((label, i) => ({ label, height: heights[i], last: i === heights.length - 1 }))
)
const expenses = [
  { key: 'rent', value: [8000, 700] },
  { key: 'materials', value: [4700, 350] },
  { key: 'ads', value: [1500, 150] }
] as const
</script>

<template>
  <HomeAppPhone :label="$ts('app.money.label')" tab="money">
    <div class="flex items-center justify-between px-4.5 pt-8.5 pb-1.5">
      <div class="font-display text-[28px] font-bold tracking-[-0.03em]">
        {{ $ts('app.money.title') }}
      </div>
      <div class="rounded-full bg-[#F1F1EE] px-2.5 py-1.5 text-[12px] font-semibold">
        {{ $ts('app.money.month') }}
      </div>
    </div>
    <div class="flex flex-col gap-0.5 px-4.5 pt-1">
      <div class="text-[12px] text-ink-muted">{{ $ts('app.money.net') }}</div>
      <div class="font-display text-[34px] font-bold tracking-[-0.03em]">
        {{ money([48200, 3400]) }}
      </div>
      <div class="text-[11.5px] font-semibold text-[#146C3A]">{{ $ts('app.money.growth') }}</div>
    </div>

    <div class="mx-3.5 mt-3 grid grid-cols-2 gap-1.5">
      <div class="flex flex-col gap-0.5 rounded-[12px] bg-surface px-3 py-2.5">
        <span class="text-[10.5px] text-ink-muted">{{ $ts('app.money.income') }}</span>
        <span class="text-[15px] font-bold">{{ money([62400, 4600]) }}</span>
      </div>
      <div class="flex flex-col gap-0.5 rounded-[12px] bg-surface px-3 py-2.5">
        <span class="text-[10.5px] text-ink-muted">{{ $ts('app.money.expenses') }}</span>
        <span class="text-[15px] font-bold">{{ money([14200, 1200]) }}</span>
      </div>
    </div>

    <div class="mx-4.5 mt-3.5 flex h-[120px] items-end gap-2.5">
      <div
        v-for="week in weeks"
        :key="week.label"
        class="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
      >
        <div
          class="w-full rounded-[8px]"
          :class="week.last ? 'bg-ink' : 'bg-[#DADAD6]'"
          :style="{ height: `${week.height}%` }"
        />
        <span class="text-[10px] text-ink-muted">{{ week.label }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between px-4.5 pt-3.5 pb-0.5">
      <span class="text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
        {{ $ts('app.money.expenses') }}
      </span>
      <span class="text-[11.5px] font-semibold">{{ $ts('app.money.add') }}</span>
    </div>
    <div class="flex flex-col px-4.5">
      <div
        v-for="(item, i) in expenses"
        :key="item.key"
        class="flex justify-between py-2 text-[12.5px]"
        :class="i < expenses.length - 1 ? 'border-b border-[#EFEFEC]' : ''"
      >
        <span>{{ $ts(`app.money.${item.key}`) }}</span>
        <span class="font-semibold">{{ money(item.value, '−') }}</span>
      </div>
    </div>
  </HomeAppPhone>
</template>
