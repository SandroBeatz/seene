<script setup lang="ts">
/**
 * The app's "Time to invite" screen ("AppRecall" artboard). When it comes on
 * screen the bottom sheet with the ready message slides up.
 */
const rows = [
  { key: 'zhanara', bg: '#FDEBF0', fg: '#9E2449' },
  { key: 'sezim', bg: '#EAF0FB', fg: '#2B4C8C' },
  { key: 'olivia', bg: '#F3EEE4', fg: '#7A5A1E' }
]
</script>

<template>
  <HomeAppPhone :label="$ts('app.recall.label')">
    <div class="flex flex-col gap-3 px-5 pt-8.5 pb-3">
      <div class="font-display text-[28px] font-bold tracking-[-0.03em]">
        {{ $ts('app.recall.title') }}
      </div>
      <div class="flex rounded-[12px] bg-[#F1F1EE] p-[3px] text-[12px] font-semibold">
        <div class="flex-1 py-[7px] text-center text-ink-muted">
          {{ $ts('app.recall.all') }}
        </div>
        <div
          class="flex-1 rounded-[9px] bg-white py-[7px] text-center shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
        >
          {{ $ts('app.recall.due') }}
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-0.5 px-3.5">
      <div
        v-for="row in rows"
        :key="row.key"
        class="flex items-center gap-2.5 border-b border-[#EFEFEC] px-1.5 py-[9px]"
      >
        <div
          class="flex size-8.5 items-center justify-center rounded-full text-[13px] font-semibold"
          :style="{ background: row.bg, color: row.fg }"
        >
          {{ $ts(`app.recall.${row.key}Name`).charAt(0) }}
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-px">
          <div class="text-[13px] font-semibold">{{ $ts(`app.recall.${row.key}Name`) }}</div>
          <div class="text-[11px] text-ink-muted">
            {{ $ts(`app.recall.${row.key}`) }}
          </div>
        </div>
        <div class="rounded-full bg-wa px-2.5 py-1.5 text-[11px] font-semibold text-white">
          {{ $ts('app.recall.call') }}
        </div>
      </div>
    </div>

    <div
      v-reveal:sheet
      class="mx-2.5 mt-auto mb-2.5 flex flex-col gap-3 rounded-[26px] border border-line bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
    >
      <div class="h-1 w-9 self-center rounded-[2px] bg-[#DADAD6]" />
      <div class="text-[13px] font-semibold">{{ $ts('app.recall.sheetTitle') }}</div>
      <div class="rounded-[14px_14px_14px_4px] bg-wa-soft px-3 py-2.5 text-[12.5px] leading-[1.45]">
        {{ $ts('app.recall.message') }}
      </div>
      <div class="flex flex-wrap gap-1.5 text-[11px] font-semibold">
        <div class="rounded-full bg-ink px-[9px] py-[5px] text-white">
          {{ $ts('app.recall.correction') }}
        </div>
        <div class="rounded-full bg-[#F1F1EE] px-[9px] py-[5px]">
          {{ $ts('app.recall.birthday') }}
        </div>
        <div class="rounded-full bg-[#F1F1EE] px-[9px] py-[5px]">
          {{ $ts('app.recall.custom') }}
        </div>
      </div>
      <div
        class="flex items-center justify-center gap-2 rounded-[14px] bg-wa p-[13px] text-[14px] font-semibold text-white"
      >
        <UIcon name="i-lucide-message-circle" class="size-4" />
        {{ $ts('app.recall.open') }}
      </div>
    </div>
  </HomeAppPhone>
</template>
