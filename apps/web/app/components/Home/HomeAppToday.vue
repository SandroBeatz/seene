<script setup lang="ts">
/** The app's "Today" screen ("AppToday" artboard). */
const { money } = useHomeMoney()

const attention = [{ key: 'remind', send: true }, { key: 'recall' }, { key: 'request' }]
const visits = [
  { time: '10:00', key: 'vika', confirmed: true },
  { time: '12:30', key: 'mira', confirmed: true },
  { time: '15:00', key: 'dina', confirmed: false }
]
</script>

<template>
  <HomeAppPhone :label="$ts('app.today.label')" tab="today">
    <div class="flex items-start justify-between px-5 pt-8.5 pb-2.5">
      <div class="flex flex-col gap-0.5">
        <div class="text-[12px] text-ink-muted">{{ $ts('app.today.date') }}</div>
        <div class="font-display text-[28px] font-bold tracking-[-0.03em]">
          {{ $ts('app.today.title') }}
        </div>
      </div>
      <div
        class="flex size-9 items-center justify-center rounded-full bg-brand-soft text-[14px] font-semibold text-brand-ink"
      >
        {{ $ts('app.today.avatar') }}
      </div>
    </div>

    <div class="mx-3.5 mt-1.5 flex flex-col gap-2 rounded-[18px] bg-surface p-3">
      <div class="text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
        {{ $ts('app.today.attention') }}
      </div>
      <div
        v-for="item in attention"
        :key="item.key"
        class="flex items-center justify-between gap-2 rounded-[12px] bg-white px-2.5 py-[9px]"
      >
        <div class="flex flex-col gap-px">
          <div class="text-[13px] font-semibold">{{ $ts(`app.today.${item.key}`) }}</div>
          <div class="text-[11px] text-ink-muted">{{ $ts(`app.today.${item.key}Meta`) }}</div>
        </div>
        <div
          v-if="item.send"
          class="flex items-center gap-[5px] rounded-full bg-wa px-2.5 py-[7px] text-[11px] font-semibold text-white"
        >
          <UIcon name="i-lucide-message-circle" class="size-3" />
          <span>{{ $ts('app.today.send') }}</span>
        </div>
        <UIcon v-else name="i-lucide-chevron-right" class="size-4 shrink-0 text-ink-muted" />
      </div>
    </div>

    <div
      class="px-5 pt-3.5 pb-1 text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase"
    >
      {{ $ts('app.today.visits') }}
    </div>
    <div class="flex flex-col px-3.5">
      <div
        v-for="(visit, i) in visits"
        :key="visit.key"
        class="flex gap-3 px-1.5 py-[9px]"
        :class="i < visits.length - 1 ? 'border-b border-[#EFEFEC]' : ''"
      >
        <div class="w-10 text-[13px] font-semibold">{{ visit.time }}</div>
        <div class="flex flex-1 flex-col gap-px">
          <div class="text-[13px] font-semibold">{{ $ts(`app.today.${visit.key}`) }}</div>
          <div class="text-[11px] text-ink-muted">
            {{ $ts(`app.today.${visit.key}Service`) }}
          </div>
        </div>
        <div
          class="h-fit rounded-full px-[7px] py-[3px] text-[10px] font-semibold"
          :class="visit.confirmed ? 'bg-[#E4F6EB] text-[#146C3A]' : 'bg-[#F1F1EE] text-ink-muted'"
        >
          {{ $ts(visit.confirmed ? 'app.confirmed' : 'app.waiting') }}
        </div>
      </div>
    </div>

    <div class="mt-auto flex items-center justify-between px-4 pb-2.5">
      <div class="flex flex-col">
        <div class="text-[11px] text-ink-muted">{{ $ts('app.today.total') }}</div>
        <div class="text-[17px] font-bold tracking-[-0.02em]">{{ money([3200, 210]) }}</div>
      </div>
      <div class="flex size-13 items-center justify-center rounded-full bg-ink text-white">
        <UIcon name="i-lucide-plus" class="size-5.5" />
      </div>
    </div>
  </HomeAppPhone>
</template>
