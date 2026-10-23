<script setup lang="ts">
/**
 * No-show calculator ("Калькулятор" artboard): three sliders, the yearly loss.
 * The total eases to each new value (animation spec), instantly with reduced
 * motion. The design's "Share to Stories" button waits for the story card.
 */
const { $ts, $localePath, getLocale } = useI18n()

const price = ref(800)
const noShows = ref(3)
const lost = ref(2)

const noShowMonth = computed(() => price.value * noShows.value)
const lostMonth = computed(() => price.value * lost.value)
const yearly = computed(() => (noShowMonth.value + lostMonth.value) * 12)

const shownYearly = ref(yearly.value)
let frame = 0

watch(yearly, (target) => {
  cancelAnimationFrame(frame)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shownYearly.value = target
    return
  }
  const from = shownYearly.value
  const start = performance.now()
  const tick = (now: number) => {
    const progress = Math.min((now - start) / 400, 1)
    shownYearly.value = Math.round(from + (target - from) * (1 - (1 - progress) ** 3))
    if (progress < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
})

onUnmounted(() => cancelAnimationFrame(frame))

const money = (value: number) =>
  `${new Intl.NumberFormat(getLocale()).format(value)} ${$ts('currency')}`

const sliders = computed(() => [
  { key: 'price', model: price, min: 300, max: 3000, step: 100, value: money(price.value) },
  { key: 'noShows', model: noShows, min: 0, max: 15, step: 1, value: String(noShows.value) },
  { key: 'lost', model: lost, min: 0, max: 15, step: 1, value: String(lost.value) }
])

const ways = ['remind', 'confirm', 'recall'] as const

useSeoMeta({
  title: () => $ts('seo.title'),
  description: () => $ts('seo.description'),
  ogTitle: () => $ts('seo.title'),
  ogDescription: () => $ts('seo.description')
})
</script>

<template>
  <div>
    <section class="border-b border-line">
      <div class="site-container flex flex-col gap-12 pt-20 pb-24">
        <div class="site-rise flex max-w-[760px] flex-col gap-4.5">
          <div class="site-eyebrow">{{ $ts('eyebrow') }}</div>
          <h1
            class="m-0 font-display text-[clamp(34px,4vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-ink"
          >
            {{ $ts('title') }}
          </h1>
          <p class="m-0 text-[18px] leading-[1.55] text-ink-muted">{{ $ts('description') }}</p>
        </div>

        <div class="flex flex-wrap gap-4">
          <div
            class="flex min-w-0 flex-[1_1_520px] flex-col gap-8 rounded-[28px] border border-line p-6 sm:p-9"
          >
            <div v-for="slider in sliders" :key="slider.key" class="flex flex-col gap-3">
              <div class="flex justify-between gap-4 text-[15px] text-ink">
                <label :id="`calc-${slider.key}`" class="font-semibold">{{
                  $ts(slider.key)
                }}</label>
                <span class="shrink-0 font-mono tabular-nums">{{ slider.value }}</span>
              </div>
              <USlider
                v-model="slider.model.value"
                :min="slider.min"
                :max="slider.max"
                :step="slider.step"
                :aria-labelledby="`calc-${slider.key}`"
                size="lg"
                class="py-2.5"
                :ui="{ thumb: 'cursor-grab ring-ink' }"
              />
            </div>
            <p class="m-0 text-[13px] leading-normal text-ink-muted">{{ $ts('lostNote') }}</p>
          </div>

          <div
            class="flex min-w-0 flex-[1_1_400px] flex-col gap-6 rounded-[28px] bg-ink p-6 text-white sm:p-9"
            aria-live="polite"
          >
            <div class="flex flex-col gap-1.5">
              <div class="text-[15px] text-[#B8B8BE]">{{ $ts('yearly') }}</div>
              <div
                class="font-display text-[clamp(44px,5vw,72px)] leading-none font-semibold tracking-[-0.045em] tabular-nums"
              >
                {{ money(shownYearly) }}
              </div>
            </div>
            <dl class="m-0 flex flex-col border-t border-[#2A2A2F] text-[15px]">
              <div class="flex justify-between gap-4 border-b border-[#2A2A2F] py-3.5">
                <dt class="text-[#B8B8BE]">{{ $ts('noShowMonth') }}</dt>
                <dd class="m-0 font-bold tabular-nums">{{ money(noShowMonth) }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-[#2A2A2F] py-3.5">
                <dt class="text-[#B8B8BE]">{{ $ts('lostMonth') }}</dt>
                <dd class="m-0 font-bold tabular-nums">{{ money(lostMonth) }}</dd>
              </div>
              <div class="flex justify-between gap-4 py-3.5">
                <dt class="text-[#B8B8BE]">{{ $ts('payback') }}</dt>
                <dd class="m-0 text-right font-bold">{{ $ts('paybackValue') }}</dd>
              </div>
            </dl>
            <UButton
              :ui="{ label: 'leading-[normal]' }"
              :to="`${$localePath('/')}#join`"
              :label="$ts('cta')"
              color="neutral"
              block
              class="leading-[normal] mt-auto rounded-full bg-white p-4 text-[16px] font-semibold text-ink hover:bg-white/90 active:scale-[0.98]"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-line bg-paper">
      <div class="site-container flex flex-col gap-10 py-22">
        <h2
          v-reveal
          class="site-h2 max-w-[720px] text-[clamp(26px,2.8vw,36px)] tracking-[-0.025em] text-ink"
        >
          {{ $ts('how.title') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          <div
            v-for="(way, i) in ways"
            :key="way"
            v-reveal="i"
            class="flex flex-col gap-2.5 rounded-[24px] border border-line bg-white p-7"
          >
            <h3 class="m-0 text-[18px] font-semibold text-ink">{{ $ts(`how.${way}.title`) }}</h3>
            <p class="m-0 text-[15px] leading-[1.55] text-ink-muted">
              {{ $ts(`how.${way}.text`) }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
