<script setup lang="ts">
/**
 * The app's "Time to invite" screen, drawn in HTML ("AppRecall" artboard). When
 * it comes on screen the bottom sheet with the ready message slides up.
 */
const rows = [
  { key: 'zhanara', bg: '#FDEBF0', fg: '#9E2449' },
  { key: 'sezim', bg: '#EAF0FB', fg: '#2B4C8C' },
  { key: 'olivia', bg: '#F3EEE4', fg: '#7A5A1E' }
]
</script>

<template>
  <div
    role="img"
    :aria-label="$ts('recall.phone.label')"
    class="h-[660px] w-[320px] rounded-[52px] bg-ink p-2.5"
  >
    <div
      class="relative flex size-full flex-col overflow-hidden rounded-[42px] bg-white text-ink"
      aria-hidden="true"
    >
      <div class="flex flex-col gap-3 px-5 pt-8.5 pb-3">
        <div class="font-display text-[28px] font-bold tracking-[-0.03em]">
          {{ $ts('recall.phone.title') }}
        </div>
        <div class="flex rounded-xl bg-[#F1F1EE] p-[3px] text-xs font-semibold">
          <div class="flex-1 py-[7px] text-center text-ink-muted">
            {{ $ts('recall.phone.all') }}
          </div>
          <div
            class="flex-1 rounded-[9px] bg-white py-[7px] text-center shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            {{ $ts('recall.phone.due') }}
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
            {{ $ts(`recall.phone.${row.key}Name`).charAt(0) }}
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-px">
            <div class="text-[13px] font-semibold">{{ $ts(`recall.phone.${row.key}Name`) }}</div>
            <div class="truncate text-[11px] text-ink-muted">
              {{ $ts(`recall.phone.${row.key}`) }}
            </div>
          </div>
          <div class="rounded-full bg-wa px-2.5 py-1.5 text-[11px] font-semibold text-white">
            {{ $ts('recall.phone.call') }}
          </div>
        </div>
      </div>

      <div
        v-reveal:sheet
        class="mx-2.5 mt-auto mb-2.5 flex flex-col gap-3 rounded-[26px] border border-line bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
      >
        <div class="h-1 w-9 self-center rounded-sm bg-[#DADAD6]" />
        <div class="text-[13px] font-semibold">{{ $ts('recall.phone.sheetTitle') }}</div>
        <div
          class="rounded-[14px_14px_14px_4px] bg-wa-soft px-3 py-2.5 text-[12.5px] leading-[1.45]"
        >
          {{ $ts('recall.phone.message') }}
        </div>
        <div class="flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <div class="rounded-full bg-ink px-[9px] py-[5px] text-white">
            {{ $ts('recall.phone.correction') }}
          </div>
          <div class="rounded-full bg-[#F1F1EE] px-[9px] py-[5px]">
            {{ $ts('recall.phone.birthday') }}
          </div>
          <div class="rounded-full bg-[#F1F1EE] px-[9px] py-[5px]">
            {{ $ts('recall.phone.custom') }}
          </div>
        </div>
        <div
          class="flex items-center justify-center gap-2 rounded-[14px] bg-wa p-[13px] text-sm font-semibold text-white"
        >
          <UIcon name="i-lucide-message-circle" class="size-4" />
          {{ $ts('recall.phone.open') }}
        </div>
      </div>
    </div>
  </div>
</template>
