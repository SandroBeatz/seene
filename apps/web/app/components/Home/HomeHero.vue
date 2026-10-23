<script setup lang="ts">
/**
 * First screen ("Главная" artboard). Motion per the animation spec, one thing
 * at a time: the text rises line by line, at 1 s the WhatsApp reminder arrives
 * on the photo, at 2.5 s the client answers, then the "Net" card counts up
 * once. Cards then drift ±4 px. Reduced motion shows everything at rest.
 */
const { $ts, $localePath, getLocale } = useI18n()

const NET = 48_200
const WA_AT = 1000
const REPLY_AT = 2500
const NET_AT = 3000
const COUNT_MS = 800

const net = ref(NET)
const formatNumber = (value: number) => new Intl.NumberFormat(getLocale()).format(value)

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
</script>

<template>
  <section class="border-b border-blush-line bg-blush">
    <div class="site-container flex flex-wrap items-center gap-14 pt-16 pb-22">
      <div class="flex min-w-0 flex-[1_1_500px] flex-col gap-7">
        <NuxtLink
          :to="`${$localePath('/')}#join`"
          class="site-rise flex items-center gap-2.5 self-start rounded-full border border-blush-line bg-white py-1.5 pr-3.5 pl-1.5 text-[13px] font-medium text-ink hover:text-ink-muted"
        >
          <span class="rounded-full bg-brand-soft px-2.5 py-1 font-semibold text-brand-ink">
            {{ $ts('hero.new') }}
          </span>
          <span>{{ $ts('hero.badge') }}</span>
          <UIcon name="i-lucide-arrow-right" class="size-3.5" />
        </NuxtLink>

        <h1
          class="site-rise m-0 max-w-[560px] font-display text-[clamp(38px,4.4vw,60px)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-ink"
          :style="lineDelay(1)"
        >
          {{ $ts('hero.titleStart') }}&#160;<span
            class="font-serif text-[1.12em] font-medium tracking-[-0.01em] text-brand italic"
            >{{ $ts('hero.titleAccent') }}</span
          >
        </h1>

        <p
          class="site-rise m-0 max-w-[500px] text-[clamp(17px,1.5vw,20px)] leading-[1.55] text-ink-muted"
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
            class="leading-[normal] rounded-full px-6.5 py-4 text-[16px] font-semibold hover:bg-ink/85 active:scale-[0.98]"
          />
          <UButton
            :ui="{ label: 'leading-[normal]' }"
            :to="$localePath('/calculator')"
            :label="$ts('hero.ctaSecondary')"
            color="neutral"
            variant="outline"
            class="leading-[normal] rounded-full bg-white px-6.5 py-4 text-[16px] font-semibold text-ink ring-[#E5D8D2] hover:bg-white/70 active:scale-[0.98]"
          />
        </div>

        <div class="site-rise flex items-center gap-3.5" :style="lineDelay(4)">
          <div class="flex" aria-hidden="true">
            <span class="size-9 rounded-full border-2 border-blush bg-[#E9D6CF]" />
            <span class="-ml-2.5 size-9 rounded-full border-2 border-blush bg-[#D9C3BA]" />
            <span class="-ml-2.5 size-9 rounded-full border-2 border-blush bg-[#F3E1DA]" />
          </div>
          <p class="m-0 text-[14px] leading-[1.4] text-ink-muted">
            {{ $ts('hero.audience') }}<br />{{ $ts('hero.free') }}
          </p>
        </div>
      </div>

      <div class="relative min-w-0 flex-[1_1_440px] pb-7 pl-7">
        <div class="aspect-square overflow-hidden rounded-[32px] md:aspect-[4/5]">
          <SiteImage
            id="H-01"
            name="h-01-hero"
            :alt="$ts('hero.imageAlt')"
            tint="#E9DCD5"
            priority
            sizes="(max-width: 767px) 100vw, 540px"
          />
        </div>

        <!-- The reminder arrives, then the client answers -->
        <div
          class="site-arrive absolute top-[18%] left-0 flex w-[260px] flex-col gap-2 rounded-[20px] bg-white p-3.5 shadow-[0_18px_50px_rgba(80,40,30,0.14)]"
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
          class="site-arrive absolute right-[-8px] bottom-0 flex w-[210px] flex-col gap-1 rounded-[20px] bg-white p-4 shadow-[0_18px_50px_rgba(80,40,30,0.14)]"
          :style="{ '--arrive': `${NET_AT - 400}ms` }"
        >
          <div class="text-[12px] text-ink-muted">{{ $ts('hero.netLabel') }}</div>
          <div
            class="font-display text-[28px] font-semibold tracking-[-0.03em] text-ink tabular-nums"
          >
            {{ formatNumber(net) }} {{ $ts('hero.netCurrency') }}
          </div>
          <div class="text-[12px] font-semibold text-wa">{{ $ts('hero.netGrowth') }}</div>
        </div>

        <div
          class="site-float absolute top-6 right-6 flex items-center gap-2 rounded-full bg-white py-2 pr-3.5 pl-2 text-[13px] font-semibold text-ink shadow-[0_12px_30px_rgba(80,40,30,0.12)] [animation-delay:-1.5s]"
        >
          <span
            class="flex size-6.5 items-center justify-center rounded-full bg-brand-soft text-[12px] text-brand-ink"
          >
            7
          </span>
          {{ $ts('hero.recall') }}
        </div>
      </div>
    </div>
  </section>
</template>
