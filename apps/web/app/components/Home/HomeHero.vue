<script setup lang="ts">
/**
 * First screen ("Главная" artboard, 24 October): the master at work (H-01),
 * the app's "Today" screen in a phone at the bottom left and one WhatsApp card
 * at the bottom right (on phones the photo takes the full width and the phone
 * sits smaller in its corner). Motion per the animation spec: the text rises line by
 * line, at 1 s the reminder arrives, 1.5 s later the client answers "Yes" with
 * two ticks; the card then drifts ±4 px. On phones the card is hidden, as in
 * the design. Reduced motion shows everything at rest.
 */
const { $ts } = useI18n()

const WA_AT = 1000
const REPLY_AT = 2500

const lineDelay = (i: number) => ({ animationDelay: `${i * 80}ms` })
const checks = computed(() => [$ts('hero.free'), $ts('hero.commission'), $ts('hero.platforms')])
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

      <div class="relative h-[480px] min-w-0 flex-[1_1_500px] md:h-[620px]">
        <div
          class="absolute top-0 right-0 h-full w-full overflow-hidden rounded-[28px] md:w-[78%] md:rounded-[36px]"
        >
          <SiteImage
            id="H-01"
            name="h-01-hero"
            :alt="$ts('hero.imageAlt')"
            tint="#E6D6CE"
            priority
            sizes="(max-width: 767px) 100vw, 450px"
          />
        </div>

        <!-- The app's "Today" screen, 320 × 660 drawn at 86%; on phones smaller,
             in the corner, so the photo stays in view -->
        <div
          class="absolute -bottom-8 left-3 h-[371px] w-[180px] drop-shadow-[0_30px_40px_rgba(40,20,15,0.22)] md:-bottom-10 md:left-0 md:h-[568px] md:w-[275px]"
        >
          <div class="origin-top-left scale-[0.5625] md:scale-[0.86]">
            <HomeAppToday />
          </div>
        </div>

        <!-- The reminder arrives, then the client answers -->
        <div
          class="site-arrive absolute right-7 bottom-9 hidden w-[236px] flex-col gap-2 rounded-[20px] bg-white p-3.5 shadow-[0_18px_44px_rgba(80,40,30,0.16)] md:flex"
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
      </div>
    </div>
  </section>
</template>
