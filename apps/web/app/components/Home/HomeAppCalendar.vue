<script setup lang="ts">
/** The app's "Calendar" screen, day view ("AppCalendar" artboard). */
const { $ts } = useI18n()

const days = computed(() =>
  $ts('app.calendar.weekdays')
    .split(',')
    .map((name, i) => ({ name, date: 20 + i, today: i === 3, busy: i < 6 }))
)

type Kind = 'visit' | 'free' | 'accent' | 'personal'
const events: { time: string; key: string; kind: Kind; height: number; confirmed?: boolean }[] = [
  { time: '10:00', key: 'vika', kind: 'visit', height: 64, confirmed: true },
  { time: '12:30', key: 'mira', kind: 'visit', height: 52 },
  { time: '14:00', key: 'free', kind: 'free', height: 46 },
  { time: '15:00', key: 'dina', kind: 'accent', height: 52 },
  { time: '16:30', key: 'personal', kind: 'personal', height: 40 },
  { time: '17:30', key: 'olivia', kind: 'visit', height: 52 }
]

const kindClass: Record<Kind, string> = {
  visit: 'bg-surface',
  free: 'border-[1.5px] border-dashed border-[#D6D6D2] bg-white',
  accent: 'bg-brand-soft',
  personal: 'border border-[#EFEFEC] bg-white'
}

const hint = (key: string) =>
  key === 'free' || key === 'personal' ? `app.calendar.${key}Hint` : `app.calendar.${key}Service`
</script>

<template>
  <HomeAppPhone :label="$ts('app.calendar.label')" tab="calendar">
    <div class="flex flex-col gap-3 px-4.5 pt-8.5 pb-2.5">
      <div class="flex items-center justify-between">
        <div class="font-display text-[28px] font-bold tracking-[-0.03em]">
          {{ $ts('app.calendar.month') }}
        </div>
        <div class="flex rounded-[10px] bg-[#F1F1EE] p-[3px] text-[11px] font-semibold">
          <span
            class="rounded-[8px] bg-white px-[9px] py-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            {{ $ts('app.calendar.day') }}
          </span>
          <span class="px-[9px] py-[5px] text-ink-muted">{{ $ts('app.calendar.week') }}</span>
        </div>
      </div>
      <div class="flex gap-0.5">
        <div
          v-for="day in days"
          :key="day.date"
          class="flex flex-1 flex-col items-center gap-[3px] rounded-[12px] py-1.5"
          :class="day.today ? 'bg-ink text-white' : 'text-ink'"
        >
          <span class="text-[10px] opacity-70">{{ day.name }}</span>
          <span class="text-[14px] font-semibold">{{ day.date }}</span>
          <span
            class="size-[3px] rounded-[2px]"
            :class="day.busy ? (day.today ? 'bg-white' : 'bg-ink') : 'bg-transparent'"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-1.5 pt-1 pr-3.5 pl-3">
      <div v-for="event in events" :key="event.time" class="flex gap-2.5">
        <div class="w-8.5 pt-0.5 text-[11px] text-ink-muted">{{ event.time }}</div>
        <div
          class="flex flex-1 flex-col gap-0.5 rounded-[12px] px-2.5 py-2"
          :class="kindClass[event.kind]"
          :style="{ height: `${event.height}px` }"
        >
          <div class="text-[12.5px] font-semibold">{{ $ts(`app.calendar.${event.key}`) }}</div>
          <div class="text-[11px] text-ink-muted">{{ $ts(hint(event.key)) }}</div>
          <div
            v-if="event.confirmed"
            class="mt-auto self-start rounded-full bg-[#E4F6EB] px-[7px] py-0.5 text-[10px] font-semibold text-[#146C3A]"
          >
            {{ $ts('app.confirmed') }}
          </div>
        </div>
      </div>
    </div>
  </HomeAppPhone>
</template>
