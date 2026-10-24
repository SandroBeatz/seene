<script setup lang="ts">
/**
 * A master's page and online booking in a phone (the "MpStep1" artboard, light
 * theme, the design's pink accent): the page, step 1 with two services picked,
 * step 2 with a time picked, and "You're booked". The 390 × 844 screen is drawn
 * at 72.31% in a 300 × 620 phone, as in the design. A picture for people: the
 * text is in the label, the content is hidden from screen readers.
 */
const props = defineProps<{ screen: 'page' | 'services' | 'time' | 'done' }>()

const { $ts } = useI18n()
const money = useHomeMoney()

const ACCENT = '#CF3767'
const ACCENT_SOFT = '#F9E7ED'

const minutes = (value: number) => {
  const hours = Math.floor(value / 60)
  const rest = value % 60
  return [
    hours ? `${hours} ${$ts('booking.phone.hour')}` : '',
    rest ? `${rest} ${$ts('booking.phone.minutes')}` : ''
  ]
    .filter(Boolean)
    .join(' ')
}

const services = computed(() =>
  [
    { m: 60, p: 600, c: '#C9A79B' },
    { m: 120, p: 800, c: '#B5867B' },
    { m: 60, p: 1700, c: '#9C7067', on: true },
    { m: 30, p: 500, c: '#D4B8AE', on: true },
    { m: 90, p: 1000, c: '#AE8F84' }
  ].map((service, i) => ({
    ...service,
    name: $ts(`booking.phone.service${i + 1}`),
    time: minutes(service.m),
    price: money(service.p)
  }))
)

const picked = computed(() => services.value.filter((service) => service.on))
const total = computed(() => ({
  price: money(picked.value.reduce((sum, service) => sum + service.p, 0)),
  time: minutes(picked.value.reduce((sum, service) => sum + service.m, 0))
}))

const works = ['#B98E83', '#8E5F58', '#D2B3A8', '#6E4743', '#A9817A', '#C7A196']
const workLabels = computed(() => $ts('booking.phone.workLabels').split(','))

const contacts = computed(() => [
  { key: 'whatsapp', icon: 'i-lucide-message-circle', label: 'WhatsApp', wa: true },
  { key: 'instagram', icon: 'i-lucide-instagram', label: 'Instagram' },
  { key: 'telegram', icon: 'i-lucide-send', label: 'Telegram' },
  { key: 'call', icon: 'i-lucide-phone', label: $ts('booking.phone.call') },
  { key: 'map', icon: 'i-lucide-map-pin', label: $ts('booking.phone.map') }
])

const stats = [
  ['experience', 'experienceLabel'],
  ['visits', 'visitsLabel'],
  ['days', 'hours']
] as const

const DATES = [23, 24, 25, 26, 27, 28, 29, 30, 31, 1]
const CLOSED = [0, 3]
const days = computed(() =>
  $ts('booking.phone.weekdays')
    .split(',')
    .map((name, i) => ({ name, date: DATES[i], on: i === 1, open: !CLOSED.includes(i) }))
)

const slots = [
  ['morning', ['10:00', '11:30']],
  ['afternoon', ['13:00', '14:30', '16:00']],
  ['evening', ['17:30', '19:00']]
] as const

const label = computed(
  () =>
    ({
      page: $ts('booking.phone.labelPage'),
      services: $ts('booking.phone.labelServices'),
      time: $ts('booking.phone.labelTime'),
      done: $ts('booking.phone.labelDone')
    })[props.screen]
)

const step = computed(() => ({ services: 1, time: 2 })[props.screen as 'services' | 'time'])
const cta = computed(
  () =>
    ({
      page: '',
      services: $ts('booking.phone.next'),
      time: $ts('booking.phone.timeNext'),
      done: $ts('booking.phone.backToPage')
    })[props.screen]
)

// The design's "Verified master" seal
const SEAL =
  '12,1 14.41,3.02 17.5,2.47 18.58,5.42 21.53,6.5 20.98,9.59 23,12 20.98,14.41 21.53,17.5 18.58,18.58 17.5,21.53 14.41,20.98 12,23 9.59,20.98 6.5,21.53 5.42,18.58 2.47,17.5 3.02,14.41 1,12 3.02,9.59 2.47,6.5 5.42,5.42 6.5,2.47 9.59,3.02'
</script>

<template>
  <div
    role="img"
    :aria-label="label"
    class="h-[620px] w-[300px] shrink-0 rounded-[50px] bg-ink p-[9px] shadow-[0_30px_50px_rgba(11,11,12,0.16)]"
  >
    <div class="relative h-[602px] w-[282px] overflow-hidden rounded-[41px] bg-white">
      <div
        class="relative flex h-[844px] w-[390px] origin-top-left scale-[0.7231] flex-col overflow-hidden bg-white text-ink"
        aria-hidden="true"
      >
        <!-- Page -->
        <template v-if="screen === 'page'">
          <div
            class="relative h-[230px] shrink-0 bg-[linear-gradient(150deg,#3A2826_0%,#7B5550_55%,#B88F86_100%)]"
          >
            <div
              class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_45%,#FFFFFF_100%)]"
            />
            <div class="absolute top-4 left-5 font-mono text-[11px] text-white/80">
              {{ $ts('booking.phone.poster') }}
            </div>
            <div
              class="absolute top-3 right-4 flex size-9 items-center justify-center rounded-full bg-white/22 text-white backdrop-blur-[8px]"
            >
              <UIcon name="i-lucide-share" class="size-4" />
            </div>
          </div>

          <div class="relative -mt-13 flex flex-col gap-3.5 px-5">
            <div
              class="flex size-23 items-center justify-center rounded-full border-4 border-white bg-[#A47D74] font-mono text-[10px] text-white/85"
            >
              {{ $ts('booking.phone.photo') }}
            </div>
            <div class="flex flex-col gap-1">
              <div
                class="flex items-center gap-1.5 font-display text-[26px] leading-[1.1] font-bold tracking-[-0.03em]"
              >
                {{ $ts('booking.phone.name') }}
                <svg width="22" height="22" viewBox="0 0 24 24" class="shrink-0">
                  <polygon
                    :points="SEAL"
                    :fill="ACCENT"
                    :stroke="ACCENT"
                    stroke-width="1.6"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M7.8 12.3l2.8 2.8 5.6-6"
                    fill="none"
                    stroke="#FFFFFF"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <div class="text-[15px] text-ink-muted">{{ $ts('booking.phone.specialty') }}</div>
              <div class="flex items-center gap-1.5 text-[14px] text-ink-muted">
                <UIcon name="i-lucide-map-pin" class="size-3.5" />
                {{ $ts('booking.phone.city') }}
              </div>
            </div>

            <div class="grid grid-cols-3 rounded-[16px] border border-line">
              <div
                v-for="([value, caption], i) in stats"
                :key="value"
                class="flex flex-col gap-0.5 px-2.5 py-3"
                :class="i ? 'border-l border-line' : ''"
              >
                <span class="font-display text-[18px] font-bold">{{
                  $ts(`booking.phone.${value}`)
                }}</span>
                <span class="text-[12px] text-ink-muted">{{
                  $ts(`booking.phone.${caption}`)
                }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <p class="m-0 line-clamp-3 text-[15px] leading-[1.55]">
                {{ $ts('booking.phone.bio') }}
              </p>
              <span class="text-[14px] font-semibold" :style="{ color: ACCENT }">
                {{ $ts('booking.phone.more') }}
              </span>
            </div>

            <div class="grid grid-cols-5 gap-1.5">
              <div
                v-for="contact in contacts"
                :key="contact.key"
                class="flex flex-col items-center gap-1.5 text-[11px] text-ink-muted"
              >
                <span
                  class="flex size-13 items-center justify-center rounded-full"
                  :class="contact.wa ? 'bg-wa text-white' : 'bg-surface text-ink'"
                >
                  <UIcon :name="contact.icon" class="size-5.5" />
                </span>
                {{ contact.label }}
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3.5 px-5 pt-8">
            <div class="flex items-baseline justify-between">
              <div class="font-display text-[20px] font-bold tracking-[-0.02em]">
                {{ $ts('booking.phone.works') }}
              </div>
              <span class="text-[14px] font-semibold" :style="{ color: ACCENT }">
                {{ $ts('booking.phone.worksAll') }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-1 overflow-hidden rounded-[16px]">
              <div
                v-for="(color, i) in works"
                :key="color"
                class="flex aspect-square items-end p-2 font-mono text-[10px] text-white/85"
                :style="{ background: color }"
              >
                {{ workLabels[i] }}
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-1.5 px-5 pt-8 pb-2">
            <div class="mb-2 font-display text-[20px] font-bold tracking-[-0.02em]">
              {{ $ts('booking.phone.services') }}
            </div>
            <div
              v-for="service in services"
              :key="service.name"
              class="flex items-center gap-3.5 border-b border-line py-3"
            >
              <div class="size-14 shrink-0 rounded-[14px]" :style="{ background: service.c }" />
              <div class="flex min-w-0 flex-1 flex-col gap-[3px]">
                <div class="text-[15px] leading-[1.3] font-semibold">{{ service.name }}</div>
                <div class="text-[13px] text-ink-muted">
                  {{ service.time }} · {{ service.price }}
                </div>
              </div>
              <span class="rounded-full border border-line px-3.5 py-2 text-[13px] font-semibold">
                {{ $ts('booking.phone.book') }}
              </span>
            </div>
          </div>

          <div
            class="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#FFFFFF_30%)] px-4 pt-3 pb-6"
          >
            <div
              class="flex items-center justify-between rounded-[16px] px-4.5 py-3.5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
              :style="{ background: ACCENT }"
            >
              <span class="flex flex-col items-start gap-0.5">
                <span class="text-[16px] font-semibold">{{ $ts('booking.phone.book') }}</span>
                <span class="text-[12px] opacity-85">{{ $ts('booking.phone.nearest') }}</span>
              </span>
              <UIcon name="i-lucide-arrow-right" class="size-5" />
            </div>
          </div>
        </template>

        <!-- Steps 1 and 2: header with the master and the progress -->
        <div v-if="step" class="flex flex-col gap-3 px-4 pt-3.5 pb-3">
          <div class="flex items-center justify-between">
            <span class="flex size-10 items-center justify-center rounded-full bg-surface">
              <UIcon name="i-lucide-chevron-left" class="size-4.5" />
            </span>
            <div class="flex items-center gap-2 text-[14px] font-semibold">
              <span class="size-6.5 rounded-full bg-[#A47D74]" />
              {{ $ts('booking.phone.name') }}
              <svg width="16" height="16" viewBox="0 0 24 24" class="shrink-0">
                <polygon
                  :points="SEAL"
                  :fill="ACCENT"
                  :stroke="ACCENT"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                />
                <path
                  d="M7.8 12.3l2.8 2.8 5.6-6"
                  fill="none"
                  stroke="#FFFFFF"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <span class="flex size-10 items-center justify-center rounded-full bg-surface">
              <UIcon name="i-lucide-x" class="size-4.5" />
            </span>
          </div>
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-3 gap-1.5">
              <span
                v-for="bar in 3"
                :key="bar"
                class="h-1 rounded-[2px]"
                :style="{ background: bar <= step ? ACCENT : '#E7E7E4' }"
              />
            </div>
            <div class="font-mono text-[11px] tracking-[0.08em] text-ink-muted uppercase">
              {{ $ts('booking.phone.step', { n: step }) }}
            </div>
          </div>
        </div>

        <!-- Step 1: services -->
        <div v-if="screen === 'services'" class="flex flex-col gap-2.5 px-4 pt-2">
          <div class="mx-1 mb-1.5 flex flex-col gap-1">
            <div class="font-display text-[26px] font-bold tracking-[-0.03em]">
              {{ $ts('booking.phone.servicesTitle') }}
            </div>
            <p class="m-0 text-[14px] text-ink-muted">{{ $ts('booking.phone.servicesHint') }}</p>
          </div>
          <div
            v-for="service in services"
            :key="service.name"
            class="flex items-center gap-3 rounded-[18px]"
            :class="service.on ? 'border-2 p-[11px]' : 'border border-line p-3'"
            :style="service.on ? { borderColor: ACCENT, background: ACCENT_SOFT } : {}"
          >
            <span class="size-13 shrink-0 rounded-[12px]" :style="{ background: service.c }" />
            <span class="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span class="text-[15px] leading-[1.3] font-semibold">{{ service.name }}</span>
              <span class="text-[13px] text-ink-muted">{{ service.time }}</span>
            </span>
            <span class="flex flex-col items-end gap-1.5">
              <span class="text-[15px] font-semibold whitespace-nowrap">{{ service.price }}</span>
              <span
                class="flex size-5.5 items-center justify-center rounded-[7px] text-white"
                :class="service.on ? '' : 'border-2 border-line'"
                :style="service.on ? { background: ACCENT } : {}"
              >
                <UIcon v-if="service.on" name="i-lucide-check" class="size-3" />
              </span>
            </span>
          </div>
        </div>

        <!-- Step 2: day and time -->
        <div v-if="screen === 'time'" class="flex flex-col gap-4.5 px-4 pt-2">
          <div class="mx-1 font-display text-[26px] font-bold tracking-[-0.03em]">
            {{ $ts('booking.phone.timeTitle') }}
          </div>
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center justify-between px-1">
              <span class="text-[15px] font-semibold">{{ $ts('booking.phone.months') }}</span>
              <span class="text-[12px] text-ink-muted">{{ $ts('booking.phone.timezone') }}</span>
            </div>
            <div class="-mx-4 flex gap-1.5 overflow-hidden px-4">
              <div
                v-for="day in days"
                :key="`${day.name}${day.date}`"
                class="flex h-18 w-13 shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] border"
                :class="[
                  day.on ? 'text-white' : 'border-line bg-white',
                  day.open ? '' : 'opacity-40'
                ]"
                :style="day.on ? { background: ACCENT, borderColor: ACCENT } : {}"
              >
                <span class="text-[12px]">{{ day.name }}</span>
                <span class="font-display text-[18px] font-bold">{{ day.date }}</span>
                <span
                  class="size-1 rounded-[2px]"
                  :style="{ background: day.open ? (day.on ? '#FFFFFF' : ACCENT) : 'transparent' }"
                />
              </div>
            </div>
          </div>
          <div v-for="[group, times] in slots" :key="group" class="flex flex-col gap-2">
            <div class="px-1 text-[13px] text-ink-muted">{{ $ts(`booking.phone.${group}`) }}</div>
            <div class="grid grid-cols-4 gap-1.5">
              <span
                v-for="time in times"
                :key="time"
                class="flex h-11 items-center justify-center rounded-[12px] border text-[15px] font-semibold"
                :class="time === '11:30' ? 'text-white' : 'border-line bg-white'"
                :style="time === '11:30' ? { background: ACCENT, borderColor: ACCENT } : {}"
              >
                {{ time }}
              </span>
            </div>
          </div>
        </div>

        <!-- Step 4: booked -->
        <div v-if="screen === 'done'" class="flex flex-col gap-5.5 px-5 pt-14">
          <div class="flex flex-col items-center gap-3.5 text-center">
            <span
              class="flex size-18 items-center justify-center rounded-full text-white"
              :style="{ background: ACCENT }"
            >
              <UIcon name="i-lucide-check" class="size-8" />
            </span>
            <div class="font-display text-[28px] font-bold tracking-[-0.03em]">
              {{ $ts('booking.phone.doneTitle') }}
            </div>
            <p class="m-0 text-[15px] leading-normal text-ink-muted">
              {{ $ts('booking.phone.doneText') }}
            </p>
          </div>
          <div class="overflow-hidden rounded-[20px] border border-line">
            <div class="flex items-center gap-3 bg-surface px-4 py-3.5">
              <span class="size-10 shrink-0 rounded-full bg-[#A47D74]" />
              <span class="flex flex-col gap-0.5">
                <span class="text-[15px] font-semibold">{{
                  picked.map((s) => s.name).join(' + ')
                }}</span>
                <span class="text-[13px] text-ink-muted">{{ total.time }} · {{ total.price }}</span>
              </span>
            </div>
            <div class="px-4 py-1">
              <div class="flex items-center gap-3 border-b border-line py-3 text-[14px]">
                <UIcon name="i-lucide-calendar" class="size-4.5" />
                <span class="font-semibold">{{ $ts('booking.phone.doneWhen') }}</span>
              </div>
              <div class="flex items-center gap-3 py-3 text-[14px]">
                <UIcon name="i-lucide-map-pin" class="size-4.5" />
                <span>{{ $ts('booking.phone.address') }}</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <span
              class="flex items-center justify-center gap-2 rounded-[14px] border border-line p-3.5 text-[14px] font-semibold"
            >
              <UIcon name="i-lucide-calendar-plus" class="size-4" />
              {{ $ts('booking.phone.addToCalendar') }}
            </span>
            <span
              class="flex items-center justify-center gap-2 rounded-[14px] border border-line p-3.5 text-[14px] font-semibold"
            >
              <UIcon name="i-lucide-navigation" class="size-4" />
              {{ $ts('booking.phone.route') }}
            </span>
          </div>
          <div
            class="flex items-start gap-2.5 rounded-[14px] p-3.5 text-[13px] leading-normal"
            :style="{ background: ACCENT_SOFT }"
          >
            <UIcon name="i-lucide-message-circle" class="mt-0.5 size-4 shrink-0" />
            <span>{{ $ts('booking.phone.doneNote') }}</span>
          </div>
        </div>

        <!-- Bottom bar of the steps -->
        <div
          v-if="cta"
          class="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#FFFFFF_30%)] px-4 pt-3.5 pb-6"
        >
          <div v-if="step" class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              class="font-display text-[20px] leading-[1.15] font-bold tracking-[-0.02em] whitespace-nowrap"
            >
              {{ total.price }}
            </span>
            <span class="truncate text-[13px] text-ink-muted">
              {{ step === 1 ? `${total.time} · ${$ts('booking.phone.count')}` : total.time }}
            </span>
          </div>
          <span
            class="flex items-center justify-center rounded-[16px] py-4 text-[16px] font-semibold text-white"
            :class="step ? 'flex-none px-5.5' : 'flex-1 px-4.5'"
            :style="{ background: ACCENT }"
          >
            {{ cta }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
