<script setup lang="ts">
/**
 * Pricing ("Цены" artboard): Free and Pro in the visitor's currency, with no
 * switch: the market comes from the country (`useMarket`), and "Another
 * country?" changes it. Another country sees the language's guess. Pro prices
 * are the design's preliminary ones (the note under the cards says so).
 */
import type { DropdownMenuItem } from '@nuxt/ui'
import type { PriceMarket } from '#shared/utils/market'

const { $ts, $localePath } = useI18n()
const { priceMarket: market, choose } = useMarket()

const PRICES: Record<PriceMarket, { pro: number; visit: number }> = {
  kg: { pro: 400, visit: 800 },
  ca: { pro: 12, visit: 60 }
}

const price = computed(() => PRICES[market.value])
const currency = computed(() => $ts(`currency.${market.value}`))
const join = computed(() => `${$localePath('/')}#join`)

const markets = computed<DropdownMenuItem[]>(() =>
  (['kg', 'ca'] as const).map((value) => ({
    label: $ts(`market.${value}`),
    type: 'checkbox' as const,
    checked: market.value === value,
    onSelect: () => choose(value)
  }))
)
const freeFeatures = ['f1', 'f2', 'f3', 'f4', 'f5'] as const
const proFeatures = ['f1', 'f2', 'f3', 'f4'] as const
const questions = ['trial', 'cancel', 'stop', 'clients'] as const

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
      <div class="site-container flex flex-col items-center gap-12 pt-22 pb-24">
        <div class="site-rise flex max-w-[760px] flex-col items-center gap-5 text-center">
          <div class="site-eyebrow">{{ $ts('eyebrow') }}</div>
          <h1
            class="m-0 font-display text-[clamp(34px,4.2vw,56px)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance text-ink"
          >
            {{ $ts('title') }}
          </h1>
          <p class="m-0 text-[18px] leading-[1.55] text-ink-muted">{{ $ts('description') }}</p>
        </div>

        <div
          class="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[14px] text-ink-muted"
        >
          <UIcon name="i-lucide-map-pin" class="size-4" />
          <span>{{ $ts(`market.line.${market}`) }}</span>
          <UDropdownMenu :items="markets" :content="{ align: 'center' }">
            <button
              type="button"
              class="cursor-pointer border-0 bg-transparent p-0 text-[14px] font-semibold text-ink underline underline-offset-3 hover:text-ink-muted"
            >
              {{ $ts('market.change') }}
            </button>
          </UDropdownMenu>
        </div>

        <div
          class="grid w-full max-w-[960px] grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4"
        >
          <div v-reveal class="flex flex-col gap-7 rounded-[28px] border border-line p-7 sm:p-9">
            <div class="flex flex-col gap-2.5">
              <h2 class="m-0 text-[20px] font-semibold text-ink">{{ $ts('free.title') }}</h2>
              <div class="flex items-baseline gap-2">
                <span class="font-display text-[56px] font-semibold tracking-[-0.04em] text-ink"
                  >0</span
                >
                <Transition
                  mode="out-in"
                  enter-active-class="transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  leave-active-class="transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  enter-from-class="opacity-0 translate-y-1"
                  leave-to-class="opacity-0 -translate-y-1"
                >
                  <span :key="market" class="text-[16px] text-ink-muted">
                    {{ currency }} {{ $ts('free.period') }}
                  </span>
                </Transition>
              </div>
              <p class="m-0 text-[15px] text-ink-muted">{{ $ts('free.note') }}</p>
            </div>
            <UButton
              :ui="{ label: 'leading-[normal]' }"
              :to="join"
              :label="$ts('free.cta')"
              color="neutral"
              variant="outline"
              block
              class="leading-[normal] rounded-full p-3.5 text-[16px] font-semibold text-ink ring-[#D6D6D2] active:scale-[0.98]"
            />
            <ul class="m-0 flex list-none flex-col gap-3.5 p-0 text-[15px] text-ink">
              <li v-for="feature in freeFeatures" :key="feature" class="flex gap-2.5">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4.5 shrink-0" />
                {{ $ts(`free.${feature}`) }}
              </li>
            </ul>
          </div>

          <div
            v-reveal="1"
            class="flex flex-col gap-7 rounded-[28px] border border-ink bg-ink p-7 text-white sm:p-9"
          >
            <div class="flex flex-col gap-2.5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="m-0 text-[20px] font-semibold">{{ $ts('pro.title') }}</h2>
                <span
                  class="rounded-full bg-brand-soft px-2.5 py-1.5 text-[12px] font-semibold text-[#6E1D38]"
                >
                  {{ $ts('pro.badge') }}
                </span>
              </div>
              <Transition
                mode="out-in"
                enter-active-class="transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
                leave-active-class="transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
                enter-from-class="opacity-0 translate-y-1"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <div :key="market" class="flex flex-col gap-2.5">
                  <div class="flex items-baseline gap-2">
                    <span class="font-display text-[56px] font-semibold tracking-[-0.04em]">
                      {{ price.pro }}
                    </span>
                    <span class="text-[16px] text-[#B8B8BE]"
                      >{{ currency }} {{ $ts('pro.period') }}</span
                    >
                  </div>
                  <p class="m-0 text-[15px] text-[#B8B8BE]">
                    {{ $ts(market === 'kg' ? 'pro.noteKg' : 'pro.noteCa') }}
                  </p>
                </div>
              </Transition>
            </div>
            <UButton
              :ui="{ label: 'leading-[normal]' }"
              :to="join"
              :label="$ts('pro.cta')"
              color="neutral"
              variant="solid"
              block
              class="leading-[normal] rounded-full bg-white p-3.5 text-[16px] font-semibold text-ink hover:bg-white/90 active:scale-[0.98]"
            />
            <ul class="m-0 flex list-none flex-col gap-3.5 p-0 text-[15px]">
              <li class="text-[#B8B8BE]">{{ $ts('pro.includes') }}</li>
              <li v-for="feature in proFeatures" :key="feature" class="flex gap-2.5">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4.5 shrink-0" />
                {{ $ts(`pro.${feature}`) }}
              </li>
              <li class="flex gap-2.5">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4.5 shrink-0" />
                <span>
                  {{ $ts('pro.f5') }} <span class="text-[#B8B8BE]">· {{ $ts('pro.soon') }}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <p class="m-0 text-center text-[13px] text-ink-muted">{{ $ts('disclaimer') }}</p>
      </div>
    </section>

    <section class="border-b border-line bg-paper">
      <div class="site-container flex flex-wrap items-center gap-12 py-24">
        <h2 v-reveal class="site-h2 flex-[1_1_460px] text-ink">{{ $ts('payback.title') }}</h2>
        <div
          v-reveal="1"
          class="grid flex-[1_1_420px] grid-cols-2 overflow-hidden rounded-[24px] border border-line bg-white"
        >
          <div class="flex flex-col justify-between gap-1.5 border-r border-line p-5 sm:p-7">
            <div class="text-[14px] text-ink-muted">{{ $ts('payback.pro') }}</div>
            <div
              class="font-display text-[clamp(28px,3vw,36px)] font-semibold tracking-[-0.03em] text-ink"
            >
              {{ price.pro }} {{ currency }}
            </div>
          </div>
          <div class="flex flex-col justify-between gap-1.5 p-5 sm:p-7">
            <div class="text-[14px] text-ink-muted">{{ $ts('payback.visit') }}</div>
            <div
              class="font-display text-[clamp(28px,3vw,36px)] font-semibold tracking-[-0.03em] text-brand"
            >
              {{ price.visit }} {{ currency }}
            </div>
          </div>
          <p
            class="col-span-2 m-0 border-t border-line px-5 py-5 text-[14px] text-ink-muted sm:px-7"
          >
            {{ $ts('payback.commission') }} <b class="text-ink">0%</b>.
            {{ $ts('payback.commissionRest') }}
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-line">
      <div class="site-container flex flex-wrap gap-14 py-24">
        <h2 v-reveal class="site-h2 flex-[1_1_300px] text-ink">{{ $ts('faq.title') }}</h2>
        <dl
          class="m-0 grid min-w-0 flex-[2_1_600px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-10"
        >
          <div
            v-for="(question, i) in questions"
            :key="question"
            v-reveal="i"
            class="flex flex-col gap-2 border-t border-line py-5.5"
          >
            <dt class="text-[17px] font-semibold text-ink">{{ $ts(`faq.${question}.q`) }}</dt>
            <dd class="m-0 text-[15px] leading-[1.55] text-ink-muted">
              {{ $ts(`faq.${question}.a`) }}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  </div>
</template>
