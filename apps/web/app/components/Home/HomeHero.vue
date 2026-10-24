<script setup lang="ts">
/**
 * First screen ("Главная" artboard): the master's photo, the app's "Today"
 * screen in a phone over it, and three cards. Motion per the animation spec, one
 * thing at a time: the text rises line by line, at 1 s the WhatsApp reminder
 * arrives, at 2.5 s the client answers, then the online booking card, then the
 * "Net" card counts up once. Cards then drift ±4 px. On phones the cards are
 * hidden, as in the design. Reduced motion shows everything at rest.
 */
const { $ts } = useI18n()
const money = useHomeMoney()

const NET = 48_200
const WA_AT = 1000
const REPLY_AT = 2500
const BOOKING_AT = 3000
const NET_AT = 3600
const COUNT_MS = 800

const net = ref(NET)

let timer: ReturnType<typeof setTimeout> | undefined
let frame = 0

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // The card is still hidden (its arrival is delayed), so the reset is not seen.
  net.value = 0
  timer = setTimeout(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_MS, 1)
      const eased = 1 - (1 - progress) ** 3
      net.value = Math.round((NET * eased) / 100) * 100
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }, NET_AT)
})

onUnmounted(() => {
  clearTimeout(timer)
  cancelAnimationFrame(frame)
})

const lineDelay = (i: number) => ({ animationDelay: `${i * 80}ms` })
const checks = computed(() => [$ts('hero.free'), $ts('hero.commission'), $ts('hero.platforms')])
const cardShadow = 'shadow-[0_18px_44px_rgba(80,40,30,0.16)]'
</script>

<template>
  <section class="overflow-hidden border-b border-blush-line bg-blush">
    <div class="site-container flex flex-wrap items-center gap-12 pt-18 pb-22">
      <div class="flex min-w-0 flex-[1_1_480px] flex-col gap-6.5">
        <div
          class="site-rise flex items-center gap-2.5 self-start rounded-full border border-blush-line bg-white py-1.5 pr-3.5 pl-1.5 text-[13px] font-medium text-ink"
        >
          <SeeneMark class="size-6 text-ink" />
          <span>{{ $ts('hero.badge') }}</span>
        </div>

        <h1
          class="site-rise m-0 max-w-[580px] font-display text-[clamp(38px,4.4vw,60px)] leading-[1.06] font-semibold tracking-[-0.035em] text-balance text-ink"
          :style="lineDelay(1)"
        >
          {{ $ts('hero.titleStart') }}
          <span class="font-serif text-[1.12em] font-medium tracking-[-0.01em] text-brand italic">{{
            $ts('hero.titleAccent')
          }}</span>
        </h1>

        <p
          class="site-rise m-0 max-w-[520px] text-[clamp(17px,1.5vw,20px)] leading-[1.55] text-ink-muted"
          :style="lineDelay(2)"
        >
          {{ $ts('hero.description') }}
        </p>

        <div class="site-rise flex flex-wrap gap-3" :style="lineDelay(3)">
          <UButton
            :ui="{ label: 'leading-[normal]' }"
            :to="`${$localePath('/')}#join`"
            :label="$ts('hero.cta')"
            color="primary"
            class="rounded-full px-6.5 py-4 text-[16px] leading-[normal] font-semibold hover:bg-ink/85 active:scale-[0.98]"
          />
          <UButton
            :ui="{ label: 'leading-[normal]' }"
            :to="`${$localePath('/')}#features`"
            :label="$ts('hero.ctaSecondary')"
            color="neutral"
            variant="outline"
            class="rounded-full bg-white px-6.5 py-4 text-[16px] leading-[normal] font-semibold text-ink ring-[#E5D8D2] hover:bg-white/70 active:scale-[0.98]"
          />
        </div>

        <ul
          class="site-rise m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[14px] text-ink-muted"
          :style="lineDelay(4)"
        >
          <li v-for="check in checks" :key="check" class="flex items-center gap-1.5">
            <UIcon name="i-lucide-check" class="mt-0.5 size-4.5 shrink-0 text-wa" />
            {{ check }}
          </li>
        </ul>
      </div>

      <div class="relative h-[520px] min-w-0 flex-[1_1_500px] md:h-[620px]">
        <div class="absolute top-0 right-0 h-full w-[78%] overflow-hidden rounded-[36px]">
          <SiteImage
            id="H-01"
            name="h-01-hero"
            :alt="$ts('hero.imageAlt')"
            tint="#E6D6CE"
            priority
            sizes="(max-width: 767px) 78vw, 450px"
          />
        </div>

        <!-- The app's "Today" screen, 320 × 660 drawn at 86% -->
        <div
          class="absolute -bottom-10 left-0 h-[568px] w-[275px] drop-shadow-[0_30px_40px_rgba(40,20,15,0.22)]"
        >
          <div class="origin-top-left scale-[0.86]">
            <HomeAppToday />
          </div>
        </div>

        <!-- The reminder arrives, then the client answers -->
        <div
          class="site-arrive absolute top-10 right-6 hidden w-[236px] flex-col gap-2 rounded-[20px] bg-white p-3.5 md:flex"
          :class="cardShadow"
          :style="{ '--arrive': `${WA_AT}ms` }"
        >
          <div class="flex items-center gap-1.5 text-[11px] font-semibold text-wa">
            <UIcon name="i-lucide-message-circle" class="size-3" />
            {{ $ts('hero.waLabel') }}
          </div>
          <div
            class="rounded-[12px_12px_12px_4px] bg-wa-soft px-2.5 py-2 text-[12.5px] leading-[1.4] text-ink"
          >
            {{ $ts('hero.waMessage') }}
          </div>
          <div
            class="site-appear flex items-center gap-1.5 self-end rounded-[12px_12px_4px_12px] bg-[#F1F1EE] px-2.5 py-2 text-[12.5px] text-ink"
            :style="{ '--arrive': `${REPLY_AT}ms` }"
          >
            {{ $ts('hero.waReply') }}
            <UIcon
              name="i-lucide-check-check"
              class="size-3.5 text-[#2F6BFF]"
              :aria-label="$ts('hero.waConfirmed')"
            />
          </div>
        </div>

        <div
          class="site-arrive absolute top-[300px] -right-2 hidden items-center gap-2.5 rounded-[18px] bg-white py-2.5 pr-3.5 pl-2.5 md:flex"
          :class="cardShadow"
          :style="{ '--arrive': `${BOOKING_AT}ms` }"
        >
          <span
            class="flex size-8.5 items-center justify-center rounded-[10px] bg-brand-soft text-brand-ink"
          >
            <UIcon name="i-lucide-calendar" class="size-4" />
          </span>
          <span class="flex flex-col gap-px">
            <span class="text-[13px] font-semibold text-ink">{{ $ts('hero.bookingTitle') }}</span>
            <span class="text-[12px] text-ink-muted">{{ $ts('hero.bookingMeta') }}</span>
          </span>
        </div>

        <div
          class="site-arrive absolute right-10 bottom-8 hidden w-[200px] flex-col gap-1 rounded-[20px] bg-ink p-4 text-white md:flex"
          :class="cardShadow"
          :style="{ '--arrive': `${NET_AT - 400}ms` }"
        >
          <div class="text-[12px] text-[#A6A6AD]">{{ $ts('hero.netLabel') }}</div>
          <div class="font-display text-[26px] font-semibold tracking-[-0.03em] tabular-nums">
            {{ money(net) }}
          </div>
          <div class="text-[12px] font-semibold text-[#6FD39A]">{{ $ts('hero.netGrowth') }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
